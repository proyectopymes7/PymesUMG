# Seguridad en el flujo de desarrollo (DevSecOps)

El repositorio ejecuta tres controles de seguridad automáticos, definidos en
[`.github/workflows/security.yml`](../.github/workflows/security.yml):

| Control | Herramienta | Qué revisa | Bloquea cuando |
|---|---|---|---|
| **SAST** | Semgrep 1.178 (rulesets `default`, `owasp-top-ten`, `javascript`, `nodejs`, `expressjs`, `react`, `jwt` + reglas propias en `.semgrep/`) | Código fuente de Backend y Frontend | Hay hallazgos de severidad alta (`ERROR`, `HIGH` o `CRITICAL`) |
| **SCA** | `npm audit` (Backend y Frontend) + Dependency Review + Dependabot | Dependencias de terceros contra la base de datos de vulnerabilidades de GitHub | Una dependencia de producción tiene vulnerabilidad `high` o `critical`; o un PR agrega una dependencia vulnerable |
| **Secretos** | Gitleaks 8.30.1 | Archivos actuales **y todo el historial de commits** | Se encuentra cualquier credencial, token o clave |

## ¿Cuándo se ejecuta?

- **En cada Pull Request** hacia `master`/`main`: los resultados aparecen en la pestaña *Checks* del PR.
  La protección de rama exige que pasen antes de permitir la fusión.
- **Antes de cada despliegue**: `deploy.yml` llama a `security.yml` como primer job
  (`Security gate`). Si falla, el job `deploy` no se ejecuta y producción no cambia.
- **Cada lunes 06:00 UTC** (programado): detecta CVE publicados después del último cambio.
- **Manualmente** desde *Actions → Security Pipeline → Run workflow*.

## ¿Dónde veo los resultados?

- *Actions → (ejecución) → Summary*: tabla resumen de cada control.
- *Security → Code scanning*: hallazgos de Semgrep y Gitleaks (formato SARIF).
- *Actions → (ejecución) → Artifacts*: reportes completos (`semgrep.json`, `npm-audit.json`, `gitleaks.sarif`).
- *Security → Dependabot*: alertas de dependencias y PRs automáticos de actualización.

## ¿Qué hago si el pipeline falla?

1. **SAST**: abra el hallazgo (el log marca archivo y línea). Corrija el código.
   Si es un falso positivo, agregue en la línea un comentario
   `// nosemgrep: <id-de-regla> - <justificación>` y explíquelo en el PR.
2. **SCA**: ejecute `npm audit` en la carpeta indicada y luego `npm audit fix`.
   Si la corrección requiere una versión mayor, actualice ese paquete, pruebe y suba el `package-lock.json`.
3. **Secretos**: **considere la credencial comprometida**. Revóquela/rótela en el
   proveedor (Azure, OpenAI, Gmail, etc.) *antes* de limpiar el código. Muévala al
   archivo `.env` (ignorado por git) y, si llegó a un commit, reescriba el historial.

## Control local opcional

```bash
pip install pre-commit
pre-commit install   # Gitleaks revisa cada commit antes de crearse
```

## Nota de operación del servidor

- La API (`/var/www/backend/server.js`) la ejecuta el **PM2 del usuario `deploy`**
  como servicio `pm2-deploy` (systemd), el mismo usuario del runner de GitHub Actions.
  Así `pm2 restart backend` en `deploy.yml` reinicia el proceso real.
  No inicie otra copia con el PM2 de `root`: ocuparía el puerto 3000 y los
  despliegues dejarían de aplicarse.
- El paso *Verify backend API is up* de `deploy.yml` hace fallar el despliegue si la
  API no responde tras reiniciar.
- `/var/www/backend/.env` debe tener permisos `600` (solo lectura del usuario `deploy`).
