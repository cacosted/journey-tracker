import { BrowserRouter, Route, Routes } from "react-router";
import { Layout } from "./ui/Layout";
import { RunDetail } from "./runs/RunDetail";
import { RunForm } from "./runs/RunForm";
import { RunList } from "./runs/RunList";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<RunList />} />
          <Route path="new" element={<RunForm />} />
          <Route path="run/:runId" element={<RunDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
