const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const si = require("systeminformation");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permite conexiones desde cualquier origen
  },
});

app.use(cors());

io.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Enviar información cada segundo
  setInterval(async () => {
    try {
      // Obtener datos del CPU
      const cpu = await si.currentLoad();
      const cpuInfo = await si.cpu();

      // Obtener datos de memoria
      const memory = await si.mem();

      // Obtener datos de disco
      const disk = await si.fsSize();

      // Obtener estadísticas de red
      const network = await si.networkStats();

      // Validar si networkStats() devuelve datos
      let networkData = { upload: "N/A", download: "N/A" };
      if (network && network.length > 0) {
        networkData = {
          upload: (network[0].tx_sec / 1024).toFixed(2) + " KB/s",
          download: (network[0].rx_sec / 1024).toFixed(2) + " KB/s",
        };
      }

      // Emitir eventos al cliente
      socket.emit("systemStats", {
        cpu: cpu.currentLoad.toFixed(2),
        memory: ((memory.used / memory.total) * 100).toFixed(2),
        disk: ((disk[0].used / disk[0].size) * 100).toFixed(2),
        network: networkData,
      });

      socket.emit("cpuInfo", { model: cpuInfo.brand });
      socket.emit("memoryInfo", { total: (memory.total / 1073741824).toFixed(2) + " GB" });
      socket.emit("diskInfo", { total: (disk[0].size / 1073741824).toFixed(2) + " GB" });
      socket.emit("networkInfo", networkData);
    } catch (error) {
      console.error("Error obteniendo datos del sistema:", error);
    }
  }, 1000);
});

server.listen(4000, () => console.log("Servidor corriendo en http://localhost:4000"));
