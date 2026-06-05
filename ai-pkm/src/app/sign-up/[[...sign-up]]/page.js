import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', position: 'relative', zIndex: 1
    }}>
      <SignUp
        afterSignUpUrl="/knowledge-base"
        redirectUrl="/knowledge-base"
        fallbackRedirectUrl="/knowledge-base"
      />
    </div>
  );
}
