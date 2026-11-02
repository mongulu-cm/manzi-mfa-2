import type { InterviewResource } from '../utils/interview-resources'

// Sélection validée par le collectif ; liens vérifiés le 2026-11-02 (npm run test:resource-links).
// Toute modification passe par une PR ; validateResources est vérifié en CI.
export const interviewResources: InterviewResource[] = [
  {
    id: 'tech-interview-handbook',
    title: 'Tech Interview Handbook',
    description: 'Guide couvrant tout le processus de recrutement technique : CV, algorithmique, entretiens comportementaux et négociation.',
    url: 'https://www.techinterviewhandbook.org/',
    category: 'methode',
    language: 'en',
  },
  {
    id: 'interviewing-io',
    title: 'interviewing.io',
    description: 'Entretiens techniques blancs et anonymes avec des ingénieurs en poste.',
    url: 'https://interviewing.io/',
    category: 'entretiens-blancs',
    language: 'en',
  },
  {
    id: 'pramp',
    title: 'Pramp',
    description: 'Entretiens blancs entre pairs, en visioconférence.',
    url: 'https://www.pramp.com/',
    category: 'entretiens-blancs',
    language: 'en',
  },
  {
    id: 'neetcode-roadmap',
    title: 'NeetCode Roadmap',
    description: 'Parcours d’exercices d’algorithmique classés par thème et par difficulté.',
    url: 'https://neetcode.io/roadmap',
    category: 'algorithmique',
    language: 'en',
  },
  {
    id: 'leetcode',
    title: 'LeetCode',
    description: 'Banque d’exercices d’algorithmique utilisés dans les entretiens techniques.',
    url: 'https://leetcode.com/',
    category: 'algorithmique',
    language: 'en',
  },
  {
    id: 'system-design-primer',
    title: 'System Design Primer',
    description: 'Fiches et exercices pour préparer les entretiens de conception de systèmes.',
    url: 'https://github.com/donnemartin/system-design-primer',
    category: 'conception-systemes',
    language: 'en',
  },
  {
    id: 'front-end-interview-handbook',
    title: 'Front End Interview Handbook',
    description: 'Questions et réponses pour les entretiens front-end : JavaScript, CSS et HTML.',
    url: 'https://www.frontendinterviewhandbook.com/',
    category: 'front-end',
    language: 'en',
  },
  {
    id: 'exercism',
    title: 'Exercism',
    description: 'Exercices de programmation dans de nombreux langages, avec des retours de mentors.',
    url: 'https://exercism.org/',
    category: 'pratique',
    language: 'en',
  },
  {
    id: 'roadmap-sh',
    title: 'roadmap.sh',
    description: 'Parcours de compétences par métier pour cibler sa préparation.',
    url: 'https://roadmap.sh/',
    category: 'parcours',
    language: 'en',
  },
]
