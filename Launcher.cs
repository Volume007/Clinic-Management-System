using System;
using System.Diagnostics;
using System.Threading;
using System.IO;
using System.Runtime.InteropServices;

namespace ClinicLauncher
{
    class Program
    {
        [DllImport("user32.dll")]
        static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("kernel32.dll")]
        static extern IntPtr GetConsoleWindow();

        const int SW_HIDE = 0;

        static void Main(string[] args)
        {
            // Hide the console window instantly at startup
            IntPtr hConsole = GetConsoleWindow();
            if (hConsole != IntPtr.Zero)
            {
                ShowWindow(hConsole, SW_HIDE);
            }

            try
            {
                string appDir = AppDomain.CurrentDomain.BaseDirectory;

                // Resolve absolute path to backend/server.js
                string scriptPath = Path.Combine(appDir, "backend\\server.js");

                // Resolve path to node.exe:
                // 1. Prioritize a local node.exe in the app folder (Portable Mode)
                string nodePath = Path.Combine(appDir, "node.exe");
                if (!File.Exists(nodePath))
                {
                    // 2. Fall back to default Program Files installation
                    nodePath = @"C:\Program Files\nodejs\node.exe";
                    if (!File.Exists(nodePath))
                    {
                        // 3. Fall back to system PATH
                        nodePath = "node";
                    }
                }

                // Start Node server silently and independently
                ProcessStartInfo nodeInfo = new ProcessStartInfo();
                nodeInfo.FileName = nodePath;
                nodeInfo.Arguments = "\"" + scriptPath + "\"";
                nodeInfo.WorkingDirectory = appDir;
                nodeInfo.UseShellExecute = true;
                nodeInfo.WindowStyle = ProcessWindowStyle.Hidden;

                Process nodeProcess = Process.Start(nodeInfo);

                // Wait 2.5 seconds to ensure the server starts up
                Thread.Sleep(2500);

                // Open the default browser to the clinic app
                ProcessStartInfo browserInfo = new ProcessStartInfo("http://localhost:5001");
                browserInfo.UseShellExecute = true;
                Process.Start(browserInfo);

                // Keep launcher alive while Node server is running
                if (nodeProcess != null)
                {
                    nodeProcess.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "launcher_error.txt"), ex.ToString());
            }
        }
    }
}
