import LegalPage, { H2, P, UL } from '@/components/legal/LegalPage'

export const metadata = {
  title: 'Privacy Policy — The Energy Leader',
  description: 'How The Energy Leader collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="May 11, 2026">

      <P>
        The Energy Leader (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is operated by Hicks Virtual
        Solutions LLC. This policy explains what information we collect when you use our website
        and apps, why we collect it, and the choices you have. By using The Energy Leader, you
        agree to the practices described here.
      </P>

      <H2>Information we collect</H2>
      <P><strong>Account information.</strong> When you create an account we collect your name,
      email address, and a hashed password. If you upload an avatar, we store the image you
      provide.</P>
      <P><strong>Quiz and program data.</strong> Your archetype quiz answers, daily reflections,
      journal entries, check-ins, and program progress are stored so you can return to your
      practice and so we can personalize what we show you.</P>
      <P><strong>Payment information.</strong> Purchases are processed by Stripe. We never see or
      store your full card number — Stripe sends us a customer ID and a record of whether your
      subscription is active.</P>
      <P><strong>Usage data.</strong> We log basic activity (sign-ins, page visits, error events)
      to keep the product working. We do not use third-party analytics or advertising trackers.</P>
      <P><strong>Communications.</strong> If you email us or reply to one of our messages, we
      keep that thread so we can follow up.</P>

      <H2>How we use your information</H2>
      <UL>
        <li>Run your account and the programs you&apos;ve signed up for.</li>
        <li>Personalize the daily card, program copy, and recommendations to your archetype.</li>
        <li>Process payments through Stripe and grant or revoke access based on subscription status.</li>
        <li>Send transactional emails (welcome, password reset, day-7 unlock) and the
          newsletters you&apos;ve opted into.</li>
        <li>Improve the product — diagnose bugs, prioritize new features, and resolve support requests.</li>
      </UL>

      <H2>Who we share information with</H2>
      <P>We do not sell your personal information. We share what we have to with the small set of
      vendors that run the product on our behalf:</P>
      <UL>
        <li><strong>Supabase</strong> — database, authentication, and file storage.</li>
        <li><strong>Stripe</strong> — payment processing and subscription billing.</li>
        <li><strong>Emailit</strong> — transactional and marketing email delivery.</li>
        <li><strong>Vercel</strong> — application hosting.</li>
      </UL>
      <P>Each vendor is contractually limited to handling your data only to provide the service
      to us. We may also disclose information if required by law or to protect our rights, but we
      will resist over-broad requests.</P>

      <H2>Cookies and local storage</H2>
      <P>We use cookies and your browser&apos;s local storage to keep you signed in, remember
      your draft journal entries, and remember admin preview settings. We do not use cookies for
      advertising or cross-site tracking.</P>

      <H2>Your rights</H2>
      <P>You can view and edit most of your data inside the app under
      <strong> Settings</strong>. You can also:</P>
      <UL>
        <li>Request a copy of your data by emailing nicole@theenergyleader.com.</li>
        <li>Request deletion of your account and associated data.</li>
        <li>Unsubscribe from marketing email using the link at the bottom of any newsletter.</li>
        <li>Cancel or change your subscription from the Stripe billing portal linked in Settings.</li>
      </UL>

      <H2>Security</H2>
      <P>Passwords are hashed; payments are tokenized; data in transit is encrypted with TLS;
      database access is restricted with row-level security policies. No system is perfect — if
      you notice a security issue, please email us so we can investigate quickly.</P>

      <H2>Children</H2>
      <P>The Energy Leader is intended for adults. We do not knowingly collect personal
      information from anyone under 18. If you believe a child has signed up, contact us and we
      will remove the account.</P>

      <H2>Where we operate</H2>
      <P>We&apos;re a US-based company and our vendors store data in the United States. If you
      use the product from outside the US you are consenting to your information being processed
      in the US.</P>

      <H2>Changes to this policy</H2>
      <P>We&apos;ll update the &ldquo;Last updated&rdquo; date above when we make changes. For
      meaningful changes we&apos;ll also email you or surface a notice in the app.</P>

      <H2>Contact</H2>
      <P>Questions, requests, or concerns — email{' '}
      <a href="mailto:nicole@theenergyleader.com" style={{ color: 'var(--gold)' }}>
        nicole@theenergyleader.com
      </a>.</P>

    </LegalPage>
  )
}
