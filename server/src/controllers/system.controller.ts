import { Request, Response } from 'express';
import { deviceService } from '../services/device.service.js';
import { realNetworkService } from '../services/realNetwork.service.js';

export const getSystemStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await deviceService.getAll();
    const active = devices.filter((d) => d.status === 'active').length;
    const paused = devices.filter((d) => d.status === 'paused').length;
    const blocked = devices.filter((d) => d.status === 'blocked').length;
    const wifiInfo = realNetworkService.getWifiInterfaceInfo();
    const bandwidth = realNetworkService.getRealBandwidthDelta();

    res.json({
      status: 'online',
      gatewayIp: wifiInfo.gatewayIp || '192.168.1.1',
      wanIp: wifiInfo.localIp,
      ssid: wifiInfo.ssid,
      bssid: wifiInfo.bssid,
      channel: wifiInfo.channel,
      band: wifiInfo.band,
      signalDbm: wifiInfo.signalDbm,
      uptimeSeconds: Math.floor(process.uptime()),
      cpuUsagePercent: Math.round(Math.min(100, 5 + Math.random() * 10)),
      ramUsagePercent: Math.round(Math.min(100, 20 + Math.random() * 15)),
      firmwareVersion: 'v2.4.1-sentinel',
      activeBandwidth: {
        downloadBps: bandwidth.downloadBps,
        uploadBps: bandwidth.uploadBps,
      },
      clientCounts: {
        total: devices.length,
        active,
        paused,
        blocked,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getMeshNodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const wifiInfo = realNetworkService.getWifiInterfaceInfo();
    const devices = await deviceService.getAll();

    const realNodes = [
      {
        nodeId: 'node_gateway',
        name: `${wifiInfo.ssid} (Main Gateway)`,
        isMainRouter: true,
        ip: wifiInfo.gatewayIp || '192.168.1.1',
        bssid: wifiInfo.bssid,
        connectedClientsCount: devices.length,
        backhaul: { type: 'wireless_5ghz', signalDbm: wifiInfo.signalDbm, speedMbps: Math.round(wifiInfo.rxRateMbps) },
        channel24: 6,
        channel5: wifiInfo.channel || 161,
      },
    ];

    res.json(realNodes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getRouterConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = await (await import('../services/router.service.js')).routerService.getConfig();
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const saveRouterConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip, username, password, enforcementMode } = req.body;
    const config = await (await import('../services/router.service.js')).routerService.saveConfig({
      ip,
      username,
      password,
      enforcementMode,
    });
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const testRouterConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ip, username, password } = req.body;
    const status = await (await import('../services/router.service.js')).routerService.testConnection(
      ip,
      username,
      password
    );
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDnsGatewayStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = (await import('../services/dnsGateway.service.js')).dnsGatewayService.getStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSystemLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const { systemLogger } = await import('../services/systemLogger.service.js');
    res.json({
      total: systemLogger.getRecentLogs(limit).length,
      logs: systemLogger.getRecentLogs(limit),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const clearSystemLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { systemLogger } = await import('../services/systemLogger.service.js');
    systemLogger.clearLogs();
    res.json({ success: true, message: 'Logs cleared.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getArpEngineStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { arpEngineService } = await import('../services/arpEngine.service.js');
    await arpEngineService.checkDriverStatus();
    res.json(arpEngineService.getStatus());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const triggerNpcapInstaller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { exec } = await import('child_process');
    const installerPath = 'c:\\Users\\hp-new\\Desktop\\wifi-management\\drivers\\npcap-installer.exe';
    exec(`explorer.exe "${installerPath}"`);
    res.json({
      success: true,
      message: 'Npcap driver installer launched. Click "Yes" on the Windows permission prompt on your screen to complete one-time setup.',
      path: installerPath,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

