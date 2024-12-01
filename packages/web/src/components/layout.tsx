import {
  IconApi,
  IconBrandGithub,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import { Button } from "./ui/button";
import { useTheme } from "@/theme";
import { Link, Outlet } from "react-router-dom";
import { ErrorBoundary } from "./error-boundary";
import { config } from "@/config";

export function Layout() {
  const [theme, setTheme] = useTheme();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <header className="border-b p-2">
          <div className="container flex items-center justify-between mx-auto">
            <div>
              <Link to="/">
                <h1 className="text-xl font-bold">Phemvault</h1>
              </Link>
              <p className="text-xs text-muted-foreground">
                Ephemeral secret sharing with zero-knowledge{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard"
                  target="_blank"
                >
                  AES-256
                </a>{" "}
                <a
                  href="https://en.wikipedia.org/wiki/End-to-end_encryption"
                  target="_blank"
                >
                  end-to-end encryption
                </a>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
              >
                {theme === "dark" ? <IconSun /> : <IconMoon />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                title="OpenAPI specification"
              >
                <a
                  href={`${config.API_URL}/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconApi />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                title="View source on GitHub"
              >
                <a
                  href="https://github.com/dillonstreator/phemvault"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconBrandGithub />
                </a>
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto py-8 px-4">
          <Outlet />
        </main>
      </div>
    </ErrorBoundary>
  );
}
