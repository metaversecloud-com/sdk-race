import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "@/App.jsx";
import GlobalProvider from "@context/GlobalProvider.jsx";

import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <GlobalProvider>
    <BrowserRouter>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </BrowserRouter>
  </GlobalProvider>,
);
