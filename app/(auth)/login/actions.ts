"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export async function handleProviderSignIn(providerId: string, callbackUrl: string = "") {
  try {
    await signIn(providerId, {
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return redirect(`/login?error=${error.type}`);
    }
    throw error;
  }
}

export const handleEmailProviderSignin = async (email: string, callbackUrl: string) => {
    console.log('handleEmailProviderSignin', email, callbackUrl);
    // first we need to check if there is a passkey for this email
    try {
        await signIn('passkey', {
            email,
            redirect: callbackUrl ? true : false,
            callbackUrl
        });
    } catch (error) {
        console.error('Error signing in with passkey', error);
    }

    // if there is no passkey, we need to sign in with email
    try {
      await signIn('nodemailer', {
        email,
        redirect: callbackUrl ? true : false,
        callbackUrl
      });

    } catch (error) {
        if (error instanceof AuthError) {
          return redirect(`/login?error=${error.type}`);
        }
        throw error;
      }
  };

