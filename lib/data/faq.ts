export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does Vitra's pricing work?",
    answer:
      "Vitra offers transparent, value-based packages: 2 CVs attract a fee of ₦6,000; anything above 2 up to 6 CVs attracts a fee of ₦15,000; and anything above 6 up to 13 CVs attracts a fee of ₦20,000 (with 13 CVs being the maximum allowance). Every package includes all 4 ATS-conscious templates, Gemini AI writing assistance, job tailoring, and unlimited PDF & Word (.docx) downloads.",
  },
  {
    question: "Can I create a strong CV if I have never held a formal job?",
    answer:
      "Yes. Vitra includes a dedicated No-Experience pathway designed for students, recent graduates, NYSC corps members, SIWES trainees, and first-time job seekers. You can highlight academic projects, volunteering, practical training, and leadership roles clearly.",
  },
  {
    question: "Does Vitra's AI make up experience or fake achievements?",
    answer:
      "No. Vitra is strictly configured never to fabricate employers, qualifications, employment dates, skills, or numerical metrics. AI helps refine the clarity and professional tone of the facts you provide, and asks you if key details are missing.",
  },
  {
    question: "What does ATS-conscious formatting mean?",
    answer:
      "Applicant Tracking Systems (ATS) parse text from your CV into structured candidate profiles. Vitra exports clean, selectable text with clear standard headings and logical reading order so recruiting software and human reviewers can read your CV easily.",
  },
  {
    question: "What happens to an existing CV when I upload it?",
    answer:
      "Your original PDF or DOCX file is stored safely in private storage and is never overwritten. Vitra extracts the text into editable structured sections so you can review, accept, or edit recommendations before generating an improved version.",
  },
  {
    question: "Can I download my CV in both PDF and Word formats?",
    answer:
      "Yes. From the CV editor you can download an up-to-date, multi-page vector PDF with clickable links or an editable Microsoft Word (.docx) file using your selected template.",
  },
  {
    question: "How is my personal information protected?",
    answer:
      "Registration is required so your documents belong strictly to your private account. Uploaded CVs and saved drafts are isolated per user, and you can delete individual files, CVs, or your entire account at any time from Settings.",
  },
];
