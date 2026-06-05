import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', zIndex: 1
    }}>
      <SignIn
        afterSignInUrl="/knowledge-base"
        redirectUrl="/knowledge-base"
        fallbackRedirectUrl="/knowledge-base"
      />
    </div>
  );
}
