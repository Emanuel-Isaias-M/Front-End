Netlify: https://nodo-cine.netlify.app


# Front-End 🎬

Este es el cliente del proyecto **TP Final (Cine App)**.  
Está desarrollado con **React 19 + Vite + Tailwind CSS**, e incluye validaciones con **Yup + React Hook Form**, navegación con **React Router**, notificaciones con **React Toastify** y alertas con **SweetAlert2**.

---

## 🚀 Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior  
- [npm](https://www.npmjs.com/) (incluido con Node)

---

## 📥 Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/Emanuel-Isaias-M/Front-End.git
   cd Front-End
Instalar dependencias:

bash
Copiar
Editar
npm install
(Opcional) Configurar variables de entorno en un archivo .env si tu app las requiere, por ejemplo:

env
Copiar
Editar
VITE_API_URL=http://localhost:3000/api
▶️ Ejecución
Desarrollo:
bash
Copiar
Editar
npm run dev
El proyecto quedará disponible en:

arduino
Copiar
Editar
http://localhost:5173
Producción (build optimizado):
bash
Copiar
Editar
npm run build
Previsualización del build:
bash
Copiar
Editar
npm run preview
📂 Estructura del proyecto
csharp
Copiar
Editar
├── public/                 # Archivos estáticos
├── src/                    # Código fuente principal
│   ├── assets/             # Imágenes, íconos, etc.
│   ├── components/         # Componentes reutilizables
│   ├── context/            # Contextos (Auth, Watchlist, Movies, etc.)
│   ├── pages/              # Vistas principales (Login, Register, Home, etc.)
│   ├── services/           # Conexión con la API
│   ├── styles/             # Estilos globales
│   └── main.jsx            # Punto de entrada React
├── vite.config.js          # Configuración de Vite
├── tailwind.config.js      # Configuración de Tailwind
├── postcss.config.js       # Configuración de PostCSS
├── eslint.config.js        # Reglas de ESLint
└── package.json
📡 Funcionalidades principales
🔑 Autenticación de usuarios (login / register)

🎬 CRUD de películas (crear, editar, eliminar, listar)

📋 Watchlist personalizada (agregar / quitar películas)

🌐 Consumo de API propia (con persistencia en el backend)

🎨 UI moderna con Tailwind CSS

✅ Validaciones de formularios con React Hook Form + Yup

🔔 Notificaciones y alertas con Toastify y SweetAlert2

🛠️ Scripts disponibles
npm run dev → Ejecuta en modo desarrollo

npm run build → Genera el build para producción

npm run preview → Previsualiza el build optimizado

npm run lint → Corre ESLint para verificar el código

📦 Despliegue
Este proyecto se puede desplegar fácilmente en Netlify, Vercel o cualquier servicio de hosting estático.

Ejemplo Netlify:
Ejecutar el build:

bash
Copiar
Editar
npm run build
Subir la carpeta dist/ como directorio de publicación.

Si usás Netlify CLI:

bash
Copiar
Editar
netlify deploy --prod
📜 Licencia
Este proyecto está bajo la licencia MIT.

👤 Autor
Creado por Emanuel Isaias Morales ✨
