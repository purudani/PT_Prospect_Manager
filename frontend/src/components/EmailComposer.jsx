import { useState, useRef, useEffect } from 'react';
import { useProspects } from '../context/ProspectsContext';
import { API_BASE_URL } from '../config/api';
import { templates } from '../templates/emailTemplates';

export default function EmailComposer({ onClose, onSendSuccess }) {
  const { selectedProspects, clearSelection } = useProspects();
  const [recipients, setRecipients] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [message, setMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const editorRef = useRef(null);

  // Fetch default from email from backend and load default template
  useEffect(() => {
    // Fetch default email
    fetch(`${API_BASE_URL}/api/email/default-from`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.email) {
          setFromEmail(data.email);
        }
      })
      .catch(err => console.error('Failed to fetch default email:', err));
    
    // Load default template automatically
    loadTemplate('default');
  }, []);

  // Initialize recipients from selected prospects (excluding blocked ones)
  useState(() => {
    const initialRecipients = selectedProspects
      .filter(p => !p.blocked) // Filter out blocked prospects
      .map(p => ({
        id: p.id,
        name: p.firstName || p.fullName,
        fullName: p.fullName || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email,
        city: p.city || '',
        state: p.state || '',
        zipCode: p.zipCode || '',
        county: p.county || '',
        addressLine1: p.addressLine1 || '',
        addressLine2: p.addressLine2 || '',
        licenseNumber: p.licenseNumber || p.licenseNo || '',
        licenseType: p.licenseType || ''
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

  // Rich text formatting functions
  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const getEditorContent = () => {
    return editorRef.current?.innerHTML || '';
  };

  const setEditorContent = (html) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      setError('At least one recipient is required');
      return;
    }
    if (!fromEmail.trim()) {
      setError('From email is required');
      return;
    }
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    
    const htmlMessage = getEditorContent();
    if (!htmlMessage.trim() || htmlMessage.trim() === '<br>') {
      setError('Message is required');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          subject,
          previewText: previewText.trim() || undefined,
          message: htmlMessage,
          fromEmail: fromEmail.trim()
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
      setPreviewText(template.previewText || '');
      // Templates are already in HTML format, use directly
      setEditorContent(template.message);
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
                  <div className="font-medium text-sm text-gray-900">Default Recruitment Template</div>
                  <div className="text-xs text-gray-600 mt-1">Professional outreach with benefits and referral bonus</div>
                </button>
                <button
                  onClick={() => loadTemplate('followUp')}
                  disabled={sending}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-sm text-gray-900">Follow-Up Template</div>
                  <div className="text-xs text-gray-600 mt-1">For prospects who haven't responded</div>
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

          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From *
            </label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

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
                  placeholder="Add email..."
                  disabled={sending}
                  className="flex-1 min-w-[200px] px-2 py-1 text-sm border-none focus:outline-none disabled:bg-gray-50"
                />
              </div>
            </div>
            
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Type email and press Enter to add
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

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          {/* Preview Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview Text
            </label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              disabled={sending}
              maxLength={150}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Appears in inbox below subject line ({previewText.length}/150 characters)
            </p>
          </div>

          {/* Message with Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            
            {/* Formatting Toolbar */}
            <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => applyFormat('bold')}
                disabled={sending}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                title="Bold (Ctrl+B)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormat('italic')}
                disabled={sending}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                title="Italic (Ctrl+I)"
              >
                <svg className="w-4 h-4 italic font-serif text-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <text x="8" y="18" style={{ fontStyle: 'italic', fontSize: '16px', fill: 'currentColor' }}>I</text>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormat('underline')}
                disabled={sending}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                title="Underline (Ctrl+U)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0010 0V4M5 21h14" />
                </svg>
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => applyFormat('insertUnorderedList')}
                disabled={sending}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                title="Bullet List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormat('insertOrderedList')}
                disabled={sending}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                title="Numbered List"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10M3 8h.01M3 12h.01M3 16h.01" />
                </svg>
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <button
                type="button"
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) applyFormat('createLink', url);
                }}
                disabled={sending}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                title="Insert Link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => applyFormat('removeFormat')}
                disabled={sending}
                className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                title="Clear Formatting"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Rich Text Editor */}
            <style>{`
              .email-editor p {
                margin: 0 0 1em 0;
              }
              .email-editor p:last-child {
                margin-bottom: 0;
              }
              .email-editor ul {
                margin: 0.5em 0;
                padding-left: 1.5em;
                list-style-type: disc;
              }
              .email-editor li {
                margin: 0.25em 0;
              }
              .email-editor a {
                color: #2563eb;
                text-decoration: underline;
              }
              .email-editor strong {
                font-weight: 600;
              }
            `}</style>
            <div
              ref={editorRef}
              contentEditable={!sending}
              className="email-editor w-full min-h-[250px] px-3 py-2 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 overflow-y-auto"
              style={{
                maxHeight: '400px',
                outline: sending ? 'none' : undefined,
                backgroundColor: sending ? '#f3f4f6' : 'white',
                lineHeight: '1.6'
              }}
              onInput={() => setError(null)}
              suppressContentEditableWarning
            />
            
            <p className="text-xs text-gray-500 mt-1">
              Variables: [First Name], [Full Name], [addr_email], [addr_city], [addr_state], [addr_zip], [license_number]. For URL-safe values use tokens ending in _url, like [addr_city_url].
            </p>
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
            disabled={sending || !subject.trim() || !fromEmail.trim()}
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
