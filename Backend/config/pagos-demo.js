// DEMOSTRACION DevSecOps - credenciales FALSAS (no pertenecen a ningun servicio).
// Simula el error comun de escribir una credencial directamente en el codigo.
const config = {
  api_key: "Q7vX2mR9tL4wZ8nB3kC6yH1sD5fJ0gPa",
};
const AZURE_SQL_CONNECTION = "Server=tcp:pymes-demo.database.windows.net,1433;Database=pymes;User ID=pymesadmin;Password=Xr9vQ2mL7tZ4wB8n;Encrypt=true;";
module.exports = { config, AZURE_SQL_CONNECTION };
