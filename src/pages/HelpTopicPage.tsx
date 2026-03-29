import { Link, Navigate, useParams } from 'react-router-dom';

const helpTopics = ['shipping', 'returns', 'faq', 'contact'] as const;

type HelpTopic = (typeof helpTopics)[number];

type HelpPanel = {
  heading: string;
  body: string;
};

type HelpTopicContent = {
  label: string;
  title: string;
  summary: string;
  panels: HelpPanel[];
};

const contentByTopic: Record<HelpTopic, HelpTopicContent> = {
  shipping: {
    label: 'Shipping',
    title: 'Shipping information',
    summary: 'Everything about delivery timelines, order prep, and tracking updates.',
    panels: [
      {
        heading: 'Processing window',
        body: 'Orders are reviewed and prepared within 1 to 2 business days before they move into courier dispatch.',
      },
      {
        heading: 'Delivery timeline',
        body: 'Most domestic deliveries arrive in 2 to 5 business days. Peak periods can add a short delay.',
      },
      {
        heading: 'Tracking updates',
        body: 'As soon as your order is confirmed, milestones in your account timeline reflect payment, packing, and delivery progress.',
      },
    ],
  },
  returns: {
    label: 'Returns',
    title: 'Returns and exchanges',
    summary: 'How to request support if an item arrives damaged or incorrect.',
    panels: [
      {
        heading: 'Return window',
        body: 'Contact support within 7 days of delivery if there is a fulfillment issue with your order.',
      },
      {
        heading: 'Eligible issues',
        body: 'We can assist with damaged items, wrong products, or missing items reported with your order reference.',
      },
      {
        heading: 'How to request',
        body: 'Use the Contact page with your order ID and a short note so the team can respond quickly.',
      },
    ],
  },
  faq: {
    label: 'FAQ',
    title: 'Frequently asked questions',
    summary: 'Quick answers for checkout, payments, and account access.',
    panels: [
      {
        heading: 'Do I need an account to checkout?',
        body: 'You can browse without an account, but account sign-in is required before checkout so your order can be tracked.',
      },
      {
        heading: 'Can I pay with card and transfer?',
        body: 'Yes. You can choose card checkout or bank transfer from the bag panel before placing your order.',
      },
      {
        heading: 'Where can I see my order status?',
        body: 'Open your dashboard and use the track order link to view timeline milestones for each order.',
      },
    ],
  },
  contact: {
    label: 'Contact',
    title: 'Contact support',
    summary: 'Reach the Aurevia support team for order help, product questions, or account assistance.',
    panels: [
      {
        heading: 'Email support',
        body: 'support@aurevia.com',
      },
      {
        heading: 'Include in your message',
        body: 'Share your order ID, the email used at checkout, and a short description of your request.',
      },
      {
        heading: 'Response expectations',
        body: 'Support replies are usually sent within 1 business day.',
      },
    ],
  },
};

export function HelpTopicPage() {
  const { topic } = useParams<{ topic: string }>();

  if (!topic || !helpTopics.includes(topic as HelpTopic)) {
    return <Navigate to="/help/faq" replace />;
  }

  const activeTopic = topic as HelpTopic;
  const content = contentByTopic[activeTopic];

  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-[70vh]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia help</p>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {content.title}
          </h1>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-2xl">{content.summary}</p>
        </div>

        <nav className="flex flex-wrap gap-3">
          {helpTopics.map((entry) => {
            const isActive = entry === activeTopic;
            return (
              <Link
                key={entry}
                to={`/help/${entry}`}
                className={isActive
                  ? 'border border-[#0B0B0D] bg-[#0B0B0D] px-4 py-2 text-sm font-medium text-white'
                  : 'border border-[#0B0B0D]/10 bg-white px-4 py-2 text-sm font-medium text-[#0B0B0D] transition-colors hover:border-[#0B0B0D]'}
              >
                {contentByTopic[entry].label}
              </Link>
            );
          })}
        </nav>

        <div className="grid gap-4 md:grid-cols-3">
          {content.panels.map((panel) => (
            <article
              key={panel.heading}
              className="relative overflow-hidden border border-[#0B0B0D]/10 bg-white p-5 shadow-[0_20px_60px_rgba(11,11,13,0.06)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 accent-bg" />
              <h2 className="text-lg font-bold mt-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {panel.heading}
              </h2>
              {activeTopic === 'contact' && panel.body.includes('@') ? (
                <p className="mt-3 text-sm text-[#0B0B0D]">
                  <a href="mailto:support@aurevia.com" className="accent-text hover:underline">
                    {panel.body}
                  </a>
                </p>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#6E6E73]">{panel.body}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
