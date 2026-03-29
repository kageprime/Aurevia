import { Link } from 'react-router-dom';

const privacySections = [
  {
    title: 'Information we collect',
    body: 'When you place an order, create an account, or contact support, we may collect details such as your name, email address, delivery address, phone number, and order history.',
  },
  {
    title: 'How we use information',
    body: 'We use your information to process orders, provide support, improve the shopping experience, and send important updates related to your account or purchase.',
  },
  {
    title: 'Payments and security',
    body: 'Payment processing is handled by trusted providers. We do not store full card numbers on our servers and apply reasonable safeguards to protect your information.',
  },
  {
    title: 'Sharing and disclosure',
    body: 'We only share information with service providers needed to run our business, such as payment processors, couriers, and hosting vendors. We do not sell personal data.',
  },
  {
    title: 'Your choices',
    body: 'You can request updates to your profile information, ask for deletion of account data where legally permitted, and opt out of non-essential marketing communications.',
  },
  {
    title: 'Contact',
    body: 'If you have questions about this policy, contact support@aurevia.com.',
  },
] as const;

export function PrivacyPolicyPage() {
  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-[70vh]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia legal</p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-2xl">
            Effective date: March 29, 2026. This page explains what information we collect and how it is handled.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {privacySections.map((section) => (
            <article
              key={section.title}
              className="relative overflow-hidden border border-[#0B0B0D]/10 bg-white p-5 shadow-[0_20px_60px_rgba(11,11,13,0.06)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 accent-bg" />
              <h2 className="text-lg font-bold mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {section.title}
              </h2>
              {section.body.includes('@') ? (
                <p className="mt-3 text-sm leading-6 text-[#6E6E73]">
                  If you have questions about this policy, contact{' '}
                  <a href="mailto:support@aurevia.com" className="accent-text hover:underline">
                    support@aurevia.com
                  </a>
                  .
                </p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#6E6E73]">{section.body}</p>
              )}
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/terms-of-service"
            className="border border-[#0B0B0D]/10 bg-white px-4 py-2 text-sm font-medium text-[#0B0B0D] transition-colors hover:border-[#0B0B0D]"
          >
            Read Terms of Service
          </Link>
          <Link
            to="/help/contact"
            className="border border-[#0B0B0D]/10 bg-white px-4 py-2 text-sm font-medium text-[#0B0B0D] transition-colors hover:border-[#0B0B0D]"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}
