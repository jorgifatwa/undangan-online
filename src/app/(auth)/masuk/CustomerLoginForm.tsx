"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { customerLoginAction } from "./actions";

/** Form login pembeli (data login dikirim admin lewat WhatsApp/email). */
export function CustomerLoginForm() {
  const [state, action, pending] = useActionState(customerLoginAction, { error: null, email: "" });
  return (
    <form action={action} className="mt-6 grid gap-3">
      {state.error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-center text-sm"
        >
          {state.error}
        </p>
      )}
      <div className="grid gap-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          key={state.email}
        />
      </div>
      <div className="grid gap-1">
        <Label htmlFor="password">Kata sandi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
        />
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}
