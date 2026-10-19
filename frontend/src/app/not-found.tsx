import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-jm-bg px-4 text-center text-jm-text">
      <div>
        <p className="text-sm font-semibold text-jm-primary">404</p>
        <h1 className="mt-1 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-jm-text2">The page you are looking for doesn’t exist or has moved.</p>
        <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-lg bg-jm-primary px-4 text-sm font-semibold text-jm-onprimary hover:bg-jm-hover">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
