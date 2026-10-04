import { Router } from 'express';
import {
  getSystemStatus,
  getMeshNodes,
  getRouterConfig,
  saveRouterConfig,
  testRouterConnection,
  getDnsGatewayStats,
  getSystemLogs,
  clearSystemLogs,
  getArpEngineStatus,
  triggerNpcapInstaller,
  getSpeedtestPing,
  getSpeedtestDownload,
  postSpeedtestUpload,
  exportSystemBackup,
  restoreSystemBackup,
  getWifiSecurityAudit,
  getBandwidthQuota,
  updateBandwidthQuota,
} from '../controllers/system.controller.js';

const router = Router();

router.get('/status', getSystemStatus);
router.get('/nodes', getMeshNodes);
router.get('/mesh/nodes', getMeshNodes);

// Router hardware integration routes
router.get('/router', getRouterConfig);
router.post('/router', saveRouterConfig);
router.post('/router/test', testRouterConnection);

// DNS Gateway Sinkhole stats
router.get('/dns/stats', getDnsGatewayStats);

// Real-Time System & Hardware Logs
router.get('/logs', getSystemLogs);
router.delete('/logs', clearSystemLogs);

// SaaS Autonomous Layer 2 ARP Engine
router.get('/arp/status', getArpEngineStatus);
router.post('/arp/install-driver', triggerNpcapInstaller);

// Diagnostic Speedtest API
router.get('/speedtest/ping', getSpeedtestPing);
router.get('/speedtest/download', getSpeedtestDownload);
router.post('/speedtest/upload', postSpeedtestUpload);

// System Configuration Backup & Restore
router.get('/backup', exportSystemBackup);
router.post('/restore', restoreSystemBackup);

// Wi-Fi Security Audit
router.get('/audit', getWifiSecurityAudit);

// Bandwidth Quota Tracker
router.get('/quota', getBandwidthQuota);
router.post('/quota', updateBandwidthQuota);

export default router;
