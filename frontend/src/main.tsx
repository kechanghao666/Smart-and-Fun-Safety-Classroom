import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppStateProvider } from "./state/AppState";
import "./styles.css";
import "./design/tokens.css";
import "./design/layout.css";
import "./design/student.css";
import "./design/teacher.css";
import "./design/admin.css";
import "./design/alignment.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppStateProvider>
      <App />
    </AppStateProvider>
  </React.StrictMode>,
);

