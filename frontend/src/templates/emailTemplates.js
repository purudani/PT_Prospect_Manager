// Email templates for prospect outreach

export const defaultTemplate = {
  subject: "PT Job Opportunity + Referral Bonus",
  previewText: "Seeking passionate PT professionals | Sign-on bonus + $200 referral bonus | 1-on-1 patient care",
  message: `<p>Hi [First Name],</p>
<p>[Your Company Name] is seeking passionate new grads and experienced clinicians for our <strong>Physical Therapist</strong> role in the heart of <strong>[Location]</strong>.</p>
<p>Join the largest and <strong>#1-rated</strong> outpatient PT practice in [Location], where you'll treat patients <strong>1-on-1</strong> and have strong support for <strong>continuing education and growth</strong>.</p>
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
<p><strong>Know someone who'd be a great fit?</strong> We're offering a <strong>$200 referral bonus</strong>*</p>
<p>Apply or refer here: <a href="[Link]">[Link]</a></p>
<p>Best regards,</p>`
};

export const followUpTemplate = {
  subject: "Following Up - PT Position",
  previewText: "Still interested in joining our team? We'd love to hear from you!",
  message: `<p>Hi [First Name],</p>
<p>I hope this message finds you well! I wanted to follow up on my previous email regarding the Physical Therapist position.</p>
<p>I understand you may be busy, but I wanted to make sure you had a chance to review the opportunity. We're still actively seeking talented PTs to join our team, and I believe your background and experience could be a great fit.</p>
<p>If you have any questions about the position, our facility, or the benefits we offer, I'm happy to provide more information or schedule a brief call to discuss.</p>
<p>Would you be interested in learning more?</p>
<p>Looking forward to hearing from you!</p>
<p>Best regards,<br>
[Your Name]<br>
[Your Company Name]</p>`
};

export const templates = {
  default: defaultTemplate,
  followUp: followUpTemplate
};
