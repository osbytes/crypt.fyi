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
import { z } from "zod";

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
      <Toaster
        toastOptions={{
          classNames: {
            toast: "bg-background p-2 rounded-lg outline-accent border-accent",
            title: "text-foreground",
            description: "text-muted-foreground",
            closeButton: "text-foreground",
            actionButton: "text-foreground",
            cancelButton: "text-foreground",
            icon: "text-foreground",
          },
        }}
      />
      <div className="fixed top-4 right-4">
        <Button className="p-3" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
    </QueryClientProvider>
  );
}

const themeSchema = z.enum(["dark", "light"]);
type Theme = z.infer<typeof themeSchema>;

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedThemeResult = themeSchema.safeParse(
      localStorage.getItem("theme"),
    );
    return savedThemeResult.success ? savedThemeResult.data : "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme") {
        const newThemeResult = themeSchema.safeParse(e.newValue);
        if (newThemeResult.success) {
          setTheme(newThemeResult.data);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [setTheme]);

  return [theme, setTheme] as const;
}
