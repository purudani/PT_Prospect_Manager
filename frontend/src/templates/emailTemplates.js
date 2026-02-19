// Email templates for prospect outreach

export const defaultTemplate = {
  subject: "PT Job + Referral Bonus (Jersey City)",
  previewText: "Seeking passionate PT professionals | Sign-on bonus + $200 referral bonus | 1-on-1 patient care",
  message: `<p>Hi [First Name],</p>
<p>Liberty Physical Therapy is seeking passionate new grads and experienced clinicians for our <strong>Physical Therapist</strong> role in the heart of <strong>Jersey City, NJ</strong>.</p>
<p>Join the largest and <strong>#1-rated</strong> outpatient PT practice in Jersey City, where you'll treat patients <strong>1-on-1</strong> and have strong support for continuing education and growth.</p>
<p><strong>Compensation &amp; Benefits</strong></p>
<ul>
<li>Excellent salary ⭐ <strong>sign-on bonus</strong></li>
<li>Performance-based bonus</li>
<li>$2,000/year continuing education</li>
<li>Paid time off</li>
<li>Medical, dental, and vision insurance</li>
<li>401(k) match</li>
<li>Commuter benefits</li>
</ul>
<p>Know someone who'd be a great fit? We're offering a <strong>$500 referral bonus</strong>*</p>
<p>Apply or refer here: <a href="https://www.libertyptnj.com/physical-therapist">www.libertyptnj.com/physical-therapist</a></p>
<p>Best regards,</p>`
};

export const followUpTemplate = {
  subject: "Re: Following Up - PT Position",
  previewText: "Still interested in joining our team? We'd love to hear from you!",
  message: `<p>Hi [First Name],</p>
<p>I hope this message finds you well! I wanted to follow up on my previous email regarding the Physical Therapist position in Jersey City.</p>
<p>I understand you may be busy, but I wanted to make sure you had a chance to review the opportunity. We're still actively seeking talented PTs to join our team, and I believe your background and experience could be a great fit. <a href="https://www.libertyptnj.com/physical-therapist">Click here</a> for more information about the position.</p>
<p>If you have any questions about the position, I'm happy to provide more information or schedule a brief call to discuss.</p>
<p>Looking forward to hearing from you!</p>
<p>Best regards,</p>`
};

export const templates = {
  default: defaultTemplate,
  followUp: followUpTemplate
};
