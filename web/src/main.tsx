import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { daMoKhoa } from "./lib/khoa";
import { ManHinhKhoa } from "./ui/ManHinhKhoa";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource-variable/bricolage-grotesque/index.css";
import "./styles.css";

function Goc() {
  const [mo, setMo] = useState(daMoKhoa);
  return mo ? <App /> : <ManHinhKhoa onMo={() => setMo(true)} />;
}

createRoot(document.getElementById("goc")!).render(
  <StrictMode>
    <Goc />
  </StrictMode>,
);
