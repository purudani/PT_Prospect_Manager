import { useState } from 'react';
import { useProspects } from '../context/ProspectsContext';
import { templates } from '../templates/emailTemplates';

export default function EmailComposer({ onClose, onSendSuccess }) {
  const { selectedProspects, clearSelection } = useProspects();
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderName, setSenderName] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Initialize recipients from selected prospects (excluding blocked ones)
  useState(() => {
    const initialRecipients = selectedProspects
      .filter(p => !p.blocked) // Filter out blocked prospects
      .map(p => ({
        id: p.id,
        name: p.firstName || p.fullName,
        email: p.email
      }));
    setRecipients(initialRecipients);
    
    // Show warning if some prospects were blocked
    const blockedCount = selectedProspects.filter(p => p.blocked).length;
    if (blockedCount > 0) {
      setError(`${blockedCount} blocked prospect${blockedCount > 1 ? 's were' : ' was'} excluded from recipients`);
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedProspects]);

  const removeRecipient = (index) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const addRecipient = () => {
    const email = newRecipient.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email address');
      return;
    }

    // Check if already exists
    if (recipients.some(r => r.email === email)) {
      setError('Email already added');
      return;
    }

    setRecipients([...recipients, { id: Date.now(), name: '', email }]);
    setNewRecipient('');
    setError(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRecipient();
    }
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      setError('At least one recipient is required');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!message.trim()) {
      setError('Message is required');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject,
          message,
          senderName: senderName.trim() || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send emails');
      }

      // Success
      onSendSuccess(result);
      clearSelection();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to send emails. Please check your email configuration.');
    } finally {
      setSending(false);
    }
  };

  const loadTemplate = (templateKey) => {
    const template = templates[templateKey];
    if (template) {
      setSubject(template.subject);
      setMessage(template.message);
      setSenderName(template.senderName);
      setShowTemplates(false);
      setError(null);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !sending) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Send Emails</h2>
          <button
            onClick={onClose}
            disabled={sending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Template Selection */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-sm font-medium text-blue-800">Email Templates</h3>
              </div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showTemplates ? 'Hide' : 'Show'} Templates
              </button>
            </div>
            
            {showTemplates && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => loadTemplate('default')}
                  disabled={sending}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-sm text-gray-900">Default Hiring Template</div>
                  <div className="text-xs text-gray-600 mt-1">Professional outreach for PT positions at Liberty Physical Therapy</div>
                </button>
                <button
                  onClick={() => loadTemplate('followUp')}
                  disabled={sending}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-sm text-gray-900">Follow-Up Template</div>
                  <div className="text-xs text-gray-600 mt-1">Gentle follow-up for prospects who haven't responded</div>
                </button>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To: {recipients.length} recipient{recipients.length !== 1 ? 's' : ''}
            </label>
            
            {/* Recipients chips/tags */}
            <div className="border border-gray-300 rounded-md p-2 min-h-[100px] max-h-60 overflow-y-auto bg-white">
              <div className="flex flex-wrap gap-2">
                {recipients.map((recipient, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {recipient.name && (
                      <span className="font-medium">{recipient.name}</span>
                    )}
                    <span className={recipient.name ? 'text-blue-600' : 'font-medium'}>
                      {recipient.name ? `<${recipient.email}>` : recipient.email}
                    </span>
                    <button
                      onClick={() => removeRecipient(index)}
                      disabled={sending}
                      className="ml-1 hover:text-blue-900 disabled:opacity-50"
                      title="Remove recipient"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Add new recipient input */}
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={recipients.length === 0 ? "Enter email address..." : "Add another..."}
                  disabled={sending}
                  className="flex-1 min-w-[200px] px-2 py-1 text-sm border-none focus:outline-none disabled:bg-gray-50"
                />
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                💡 Type an email and press Enter to add. Click X to remove.
              </p>
              {newRecipient && (
                <button
                  onClick={addRecipient}
                  disabled={sending}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g., Deepak"
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will appear in the "From" field of the email
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={10}
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 <strong>Tip:</strong> Use "[First Name]" in your message - it will be automatically replaced with each recipient's first name (e.g., "Hi [First Name]" becomes "Hi John")
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Before Sending</h3>
              <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                <li>Make sure your Gmail credentials are configured in the backend</li>
                <li>Each email will be sent individually to maintain privacy</li>
                <li>You can send to a maximum of 50 recipients at once</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !message.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Emails
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
