import LegalPage, { H2, P, UL } from '@/components/legal/LegalPage'

export const metadata = {
  title: 'Terms of Service — The Energy Leader',
  description: 'The rules for using The Energy Leader app and programs.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="May 11, 2026">

      <P>
        These Terms govern your use of The Energy Leader (&ldquo;we&rdquo;, &ldquo;us&rdquo;), a
        product operated by Hicks Virtual Solutions LLC. By creating an account or using any of
        our programs, you agree to these Terms.
      </P>

      <H2>Eligibility</H2>
      <P>You must be at least 18 years old and able to enter a binding contract to use
      The Energy Leader.</P>

      <H2>Your account</H2>
      <P>You are responsible for keeping your password confidential and for everything that
      happens under your account. Let us know right away if you suspect unauthorized access.
      You can delete your account at any time from <strong>Settings</strong>.</P>

      <H2>Subscriptions, billing, and refunds</H2>
      <UL>
        <li><strong>365 Daily Cards (Path B)</strong> is sold as a monthly or annual subscription
          and renews automatically until you cancel.</li>
        <li><strong>Seal the Leak (Path A)</strong> is a one-time purchase with lifetime access.
          Finishing Day 7 unlocks 30 days of the Daily Cards practice; continuing after that
          requires a subscription.</li>
        <li><strong>The Circle (Path C)</strong> is a 12-week cohort program. You can pay in full
          ($497) or split into three monthly installments ($197 × 3 = $591). The 3-installment
          plan is $94 more total — paying in full is the discounted option.</li>
        <li>You can cancel any subscription anytime from the Stripe billing portal linked in
          Settings. Cancellation takes effect at the end of the current billing period.</li>
        <li>Cohort programs are non-refundable once the cohort has begun. For other refund
          requests, contact us within 14 days of purchase.</li>
      </UL>

      <H2>Acceptable use</H2>
      <P>Don&apos;t use The Energy Leader to do anything illegal, abusive, or that interferes
      with other members&apos; experience. Specifically: no harassment in community feeds, no
      attempts to access another user&apos;s account, no scraping, no resale of paid content,
      and no use of our service to send spam.</P>

      <H2>Your content</H2>
      <P>You own what you write — journal entries, reflections, partner messages, and posts. You
      grant us a limited license to store and display that content as required to run the
      service. We will not share your private content (journal, partner DMs) with other members.
      Community posts are visible to the cohort you posted them in.</P>

      <H2>Our content</H2>
      <P>The programs, daily cards, archetype frameworks, prompts, and other materials are
      copyrighted by Hicks Virtual Solutions LLC and Nicole. You may use them for your own
      personal growth practice but you may not resell, redistribute, or use them to train
      another product.</P>

      <H2>Not medical or therapeutic advice</H2>
      <P>The Energy Leader is a personal-growth tool. It is <strong>not</strong> medical advice,
      psychotherapy, or a substitute for either. If you are in crisis or experiencing a mental
      health emergency, please contact a licensed professional or your local emergency number.
      In the US you can also reach the 988 Suicide & Crisis Lifeline by dialing 988.</P>

      <H2>Disclaimers and limits of liability</H2>
      <P>The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the
      maximum extent allowed by law, our total liability to you for any claim related to the
      service is limited to the amount you have paid us in the twelve months before the claim.
      We are not liable for indirect, incidental, or consequential damages.</P>

      <H2>Indemnification</H2>
      <P>You agree to indemnify and hold us harmless from any claim arising out of your use of
      the service or your violation of these Terms.</P>

      <H2>Changes</H2>
      <P>We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date above
      reflects the current version. For meaningful changes we will email you or surface a
      notice in the app before the changes take effect.</P>

      <H2>Termination</H2>
      <P>You can stop using The Energy Leader and delete your account at any time. We may
      suspend or terminate accounts that violate these Terms. If we do, we&apos;ll generally try
      to notify you and give you a chance to export your data first.</P>

      <H2>Governing law</H2>
      <P>These Terms are governed by the laws of the Commonwealth of Virginia, United States,
      without regard to its conflict-of-laws rules.</P>

      <H2>Contact</H2>
      <P>Questions about these Terms — email{' '}
      <a href="mailto:nicole@theenergyleader.com" style={{ color: 'var(--gold)' }}>
        nicole@theenergyleader.com
      </a>.</P>

    </LegalPage>
  )
}
