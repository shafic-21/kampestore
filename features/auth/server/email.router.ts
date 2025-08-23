import { z } from "zod/v4";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { createTRPCRouter, publicProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { MagicLinkEmail } from "../email-templates/magic-link";

export const emailRouter = createTRPCRouter({
  sendMagicLink: publicProcedure
    .input(
      z.object({
        email: z.email(),
        token: z.string(),
        url: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "RESEND_API_KEY environment variable is required",
        });
      }
      const resend = new Resend(apiKey);

      try {
        const { url, token, email } = input;
        const html = await render(
          MagicLinkEmail({ loginCode: token, loginUrl: url }),
        );

        await resend.emails.send({
          from: "no-reply@kampestore.com",
          to: email,
          subject: "Use this code to login",
          html,
        });

        return {
          success: true,
          message: "Email sent successfully",
        };
      } catch (error) {
        console.error("Email sending failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
          cause: error,
        });
      }
    }),
});
