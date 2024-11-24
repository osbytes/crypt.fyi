import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { CreatePage } from "@/pages/Create";
import { ViewPage } from "@/pages/View";
import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";

const router = createBrowserRouter([
  {
    path: "/",
    element: <CreatePage />,
  },
  {
    path: "/:id",
    element: <ViewPage />,
  },
  {
    path: "*",
    loader: () => redirect("/"),
    element: null,
  },
]);

const queryClient = new QueryClient();

export default function App() {
  const [theme, setTheme] = useTheme();

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster theme={theme} />
      <div className="fixed top-4 right-4">
        <Button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
    </QueryClientProvider>
  );
}

function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    return savedTheme || "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return [theme, setTheme] as const;
}
