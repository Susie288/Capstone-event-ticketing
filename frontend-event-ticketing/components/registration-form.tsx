"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Ticket as TicketIcon, User, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { registrationSchema, RegistrationFormValues } from "@/lib/validations";
import { submitRegistration } from "@/lib/api";
import { EventItem, RegistrationResponse } from "@/types";

interface RegistrationFormProps {
  events: EventItem[];
  isLoadingEvents: boolean;
  presetEventId?: string;
  onSuccess: (data: RegistrationResponse) => void;
}

export function RegistrationForm({ events, isLoadingEvents, presetEventId, onSuccess }: RegistrationFormProps) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { eventId: "", fullName: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (presetEventId) setValue("eventId", presetEventId, { shouldValidate: true });
  }, [presetEventId, setValue]);

  const onSubmit = async (values: RegistrationFormValues) => {
    try {
      const result = await submitRegistration(values);
      toast.success("Registration successful", {
        description: `You're confirmed for ${result.eventName}.`,
      });
      reset();
      onSuccess(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while registering. Please try again.";
      toast.error("Registration failed", { description: message });
    }
  };

  return (
    <Card className="overflow-hidden shadow-xl">
      <CardHeader className="space-y-1.5 bg-secondary/40 pb-6">
        <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <TicketIcon className="h-5 w-5" />
        </div>
        <CardTitle>Reserve your seat</CardTitle>
        <CardDescription>Fill in your details below — you&apos;ll get a confirmation right away.</CardDescription>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="eventId">Event</Label>
            {isLoadingEvents ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <Controller
                control={control}
                name="eventId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="eventId" aria-invalid={!!errors.eventId}>
                      <SelectValue placeholder="Choose an event" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id} disabled={event.status === "SOLD_OUT"}>
                          {event.name} {event.status === "SOLD_OUT" ? "· Sold out" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.eventId && <p className="text-xs font-medium text-destructive">{errors.eventId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="fullName" placeholder="Ama Owusu" className="pl-10" aria-invalid={!!errors.fullName} {...register("fullName")} />
            </div>
            {errors.fullName && <p className="text-xs font-medium text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="email" type="email" placeholder="you@example.com" className="pl-10" aria-invalid={!!errors.email} {...register("email")} />
            </div>
            {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone number <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" type="tel" placeholder="+233 20 000 0000" className="pl-10" aria-invalid={!!errors.phone} {...register("phone")} />
            </div>
            {errors.phone && <p className="text-xs font-medium text-destructive">{errors.phone.message}</p>}
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button type="submit" size="lg" variant="accent" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering…
                </>
              ) : (
                "Register"
              )}
            </Button>
          </motion.div>
        </form>
      </CardContent>
    </Card>
  );
}
