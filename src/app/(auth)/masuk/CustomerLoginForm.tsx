"use client";

import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { customerLoginAction } from "./actions";

/** Form login pembeli (data login dikirim admin lewat WhatsApp/email). */
export function CustomerLoginForm() {
  const [state, action, pending] = useActionState(customerLoginAction, { error: null, email: "" });
  const [show, setShow] = useState(false);
  const field = "bg-muted/70 h-12 rounded-xl border-transparent px-4 text-[15px]";
  return (
    <form action={action} className="mt-8 grid gap-5">
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          required
          defaultValue={state.email}
          key={state.email}
          className={field}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Kata sandi</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            minLength={8}
            className={`${field} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 p-1"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          Lupa kata sandi? Hubungi admin untuk mengatur ulang.
        </p>
      </div>
      <Button type="submit" size="lg" className="h-12 rounded-xl text-[15px]" disabled={pending}>
        {pending ? "Masuk…" : "Masuk"}
      </Button>
    </form>
  );
}
