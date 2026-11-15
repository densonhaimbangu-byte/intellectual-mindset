import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/card")({
  beforeLoad: () => { throw redirect({ to: "/orders" }); },
});
