import {
  createBrowserRouter,
  redirect,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { CreatePage } from "@/pages/Create";
import { ViewPage } from "@/pages/View";

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
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
