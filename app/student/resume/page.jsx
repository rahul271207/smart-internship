'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Field, inputClass } from '@/components/common/UI';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import api from '@/lib/apiClient';

export default function ResumePage() {
  const { flash } = useAuth();
  const [extraction, setExtraction] = useState(null);
  const [skills, setSkills] = useState('');
  const [busy, setBusy] = useState(false);

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    setBusy(true);
    try {
      const { data } = await api.post('/api/students/resume', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setExtraction(data.extraction);
      setSkills((data.extraction.skills || []).join(', '));
      flash('success', data.message);
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    try {
      await api.post('/api/students/resume/confirm', {
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        projects: extraction?.projects || [],
        certifications: extraction?.certifications || [],
        overwrite_existing: false,
      });
      flash('success', 'Confirmed fields merged into your profile.');
    } catch (err) {
      flash('error', err.response?.data?.detail || 'Failed.');
    }
  }

  return (
    <DashboardLayout role="student">
      <Card title="Resume upload and review">
        <p className="text-sm text-slate-500">
          PDF only, max 5 MB. Extracted text is untrusted until you review it. Scanned image PDFs cannot be parsed.
        </p>
        <input className="mt-4" type="file" accept="application/pdf" onChange={upload} />
        {busy && <p className="mt-2 text-sm">Extracting…</p>}
        {extraction && (
          <div className="mt-6 space-y-3">
            {!extraction.ok && <p className="text-rose-700">{extraction.error}</p>}
            <Field label="Extracted skills (edit before confirm)">
              <input className={inputClass()} value={skills} onChange={(e) => setSkills(e.target.value)} />
            </Field>
            <pre className="max-h-48 overflow-auto rounded bg-slate-50 p-3 text-xs">{extraction.text_preview}</pre>
            <Button onClick={confirm}>Confirm and merge</Button>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
