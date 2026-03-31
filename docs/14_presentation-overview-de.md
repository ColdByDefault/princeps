# See-Sweet Präsentationsübersicht

## Zweck

Dieses Dokument ist eine präsentationsfertige Produktübersicht für PowerPoint. Es fasst zusammen, was See-Sweet ist, warum das Produkt existiert, was bereits umgesetzt wurde, wie es technisch aufgebaut ist und wohin sich das Produkt als Nächstes entwickelt.

## Executive Summary

See-Sweet ist ein privater KI-Workspace, der als persönliches Executive Secretariat fungiert. Statt wie ein generischer Chatbot zu arbeiten, hilft das Produkt einer einzelnen Person dabei, vorbereitet, organisiert und kontextbewusst zu bleiben – über Gespräche, Meetings, Kontakte, Entscheidungen, Dokumente und Nachverfolgung hinweg.

Das Produkt verbindet einen authentifizierten Nutzer-Workspace, Retrieval-gestützte KI-Unterstützung, strukturierte Workflow-Daten und proaktive Benachrichtigungen. Ziel ist es, einer einzelnen Person die operative Hebelwirkung zu geben, die sonst meist durch einen Chief of Staff, eine Assistenz und einen disziplinierten Arbeitsrhythmus entsteht.

## Produktvision

### Positionierung

See-Sweet sollte als privater Executive Operating Desk verstanden werden, nicht als allgemeine KI-Chat-App.

### Zentrales Versprechen

- Kognitive Last reduzieren.
- Kontinuität über laufende Arbeit hinweg sichern.
- Fragmentierte Informationen in strukturierte Unterstützung verwandeln.
- Der Nutzerin oder dem Nutzer helfen, sich vorzubereiten, Entscheidungen zu treffen, zu koordinieren und konsequent nachzuverfolgen.

### Zielgruppen

- Gründerinnen und Gründer, die Strategie, Recruiting, Fundraising und Stakeholder-Kommunikation parallel steuern.
- Senior Executives, die Vorbereitung, Erinnerungsvermögen und Entscheidungskontinuität benötigen.
- Beraterinnen, Berater und Solo-Operatoren mit mehreren parallelen Arbeitssträngen.
- Kleine Unternehmen mit bis zu 50 Mitarbeitenden, die möchten, dass jede Person im Unternehmen von einem eigenen KI-gestützten Sekretariat innerhalb eines gemeinsamen Produkts profitiert.

## Welches Problem gelöst wird

Die meisten KI-Produkte sind sitzungsbasiert und generisch. Sie beantworten Prompts, halten aber keinen verlässlichen operativen Kontext rund um die tatsächliche Arbeit der Nutzerin oder des Nutzers aufrecht.

See-Sweet löst dieses Problem durch die Kombination aus:

- Persistenter, nutzerspezifischer Erinnerung.
- Strukturierten Datensätzen für Meetings, Kontakte, Aufgaben, Entscheidungen und Wissen.
- Retrieval-gestütztem Chat, der in realen Nutzerdaten verankert ist.
- Proaktiven Briefings und Benachrichtigungs-Workflows.
- Mehrsprachiger Unterstützung für den professionellen Alltag.

Dadurch kann ein einziges anpassbares Produkt einen fragmentierten Stack aus separaten Tools für Chat, Notizen, Meeting-Vorbereitung, Aufgaben-Nachverfolgung, Kontaktwissen, Entscheidungsdokumentation und operative Briefings ersetzen.

## Produktsäulen

### 1. Privater Workspace

Jede Nutzerin und jeder Nutzer arbeitet in einer authentifizierten, nutzerspezifischen Umgebung. Daten sind pro Nutzer isoliert und auf Privatsphäre ausgelegt.

### 2. Verankerte KI-Unterstützung

Der Assistent antwortet nicht nur auf Basis des aktuellen Prompts. Er wird durch gespeicherte Chats, Wissensbausteine, persönliche Informationen, Meetings, Kontakte, Aufgaben, Entscheidungen und Einstellungen informiert.

### 3. Strukturierter Executive-Workflow

Die App geht über Chat hinaus und bietet eigene Systeme für Beziehungsmanagement, Meeting-Vorbereitung, Aufgabenverfolgung und Entscheidungsdokumentation.

### 4. Proaktive Unterstützung

Das Produkt macht Wichtiges sichtbar – durch tägliche Briefings, Follow-up-Hinweise, Überfälligkeitswarnungen, Wochenzusammenfassungen und kontextbezogene Benachrichtigungen.

## Aktueller Funktionsumfang

### Kern-Workspace

- Authentifizierter privater Workspace mit sitzungsbasierter Zugriffskontrolle.
- Onboarding-Flow für neue Nutzer.
- Admin-Bereich für interne Nutzerverwaltung.
- Oberfläche auf Englisch und Deutsch.

### KI-Assistent

- Persistenter KI-Chat auf Basis eines lokalen Ollama-Modells.
- Retrieval-fähiger System-Prompt, der aus aktuellem Nutzerkontext zusammengesetzt wird.
- Thinking Mode mit verborgenem Reasoning-Ablauf.
- Schwebendes Chat-Widget im gesamten Produkt.
- Assistenten-Einstellungen für Tonalität, Namen, Prompt-Verhalten und Modellparameter.

### Wissen und Erinnerung

- Wissensbasis für Uploads von `.txt`- und `.md`-Dateien.
- Chunking, Embeddings und pgvector-basiertes Retrieval.
- Persönliches Profil, das in den Assistenten-Kontext eingespeist wird.
- Context-Slot-Architektur zur Erweiterung um weitere Datenquellen.

### Executive-Workflow-Module

- Kontakte mit Notizen, Tags und teilbaren Kontaktkarten-Links.
- Meetings mit Agenda, Teilnehmenden, Zusammenfassungen und Vorbereitungshilfe.
- Aufgaben mit Status, Priorität, Fälligkeitsdatum und Meeting-Verknüpfung.
- Entscheidungen mit Begründung, Status und Ergebnisverfolgung.
- Reports und Briefing-Ansichten für operative Transparenz.

### Benachrichtigungen und Automatisierung

- Persistenter In-App-Benachrichtigungseingang.
- Echtzeit-Zustellung über Server-Sent Events.
- LLM-generierte Begrüßungen und Briefings.
- Geplante Hinweise für überfällige Aufgaben, Meeting-Follow-ups und Wochenrückblicke.
- Proaktive Nudges auf Basis realer Nutzerdatenmuster.

### Integrationen

- Google-Calendar-Integration mit OAuth im Read-only-Modus.
- Manuelle und geplante Synchronisierung kommender Termine in das Meetings-Modul.

## Was See-Sweet besonders macht

- Das Produkt ist auf den operativen Kontext einer einzelnen Person ausgerichtet, nicht auf einen generischen Team-Chatroom.
- Es verbindet strukturierte Workflow-Daten mit KI, statt KI als isoliertes Prompt-Fenster zu behandeln.
- Der Fokus liegt auf Kontinuität, Vorbereitung und Follow-through statt nur auf Antwortgenerierung.
- Durch lokale LLMs und lokale Embeddings via Ollama unterstützt es privacy-orientierte Deployments.

## Technologie-Stack

### Applikations-Stack

- Next.js 16 mit App Router.
- React 19.
- TypeScript 5.
- Tailwind CSS 4.
- shadcn/ui.

### Daten und Backend

- PostgreSQL 18.
- pgvector für semantisches Retrieval.
- Prisma 7 als ORM.
- Better Auth für sitzungsbasierte Authentifizierung.
- Zod 4 für Request-Validierung.

### KI und Echtzeitsysteme

- Ollama für lokale LLM-Inferenz.
- Ollama-Embedding-Modell für Wissens-Retrieval.
- Server-Sent Events für Echtzeit-Benachrichtigungen und Streaming-Verhalten.

### Plattform und Betrieb

- Docker Compose für lokale Infrastruktur.
- Vercel-kompatible Cron-Routen für geplante Jobs.
- Google OAuth 2.0 für die Kalender-Integration.

## Architekturüberblick

### Frontend

- Next.js App Router mit feature-basierten React-Komponenten.
- Mehrsprachige UI mit flachen Message-Dictionaries.
- Eigene Routen für Chat, Kontakte, Meetings, Aufgaben, Entscheidungen, Reports, Wissen, Onboarding, Einstellungen und Admin.

### Backend

- Schlanke API-Handler.
- Business-Logik organisiert in `lib/<feature>/`-Modulen.
- Nutzerbezogener Datenzugriff als zentrale Regel.
- Prisma-basierte Persistenz mit klarer Server-only-Abgrenzung.

### KI-Architektur

- Serverseitig gebauter System-Prompt.
- Slot-basierte Kontextzusammenstellung für modulare Prompt-Anreicherung.
- Retrieval aus Wissens-Chunks über Embeddings und Vektor-Suche.
- Geteilter Assistenten-Kontext für Chat, Widget, Briefings und Benachrichtigungsgenerierung.

## Business- und Produktnarrativ

See-Sweet versucht nicht, Enterprise-Collaboration-Suiten zu ersetzen. Der Mehrwert liegt in persönlicher und kleinteambezogener Hebelwirkung.

Das Produkt passt zu Nutzerinnen und Nutzern, die eine private operative Ebene brauchen, um Kontext zu bewahren, Gespräche vorzubereiten, Commitments nachzuverfolgen und Wichtiges frühzeitig sichtbar zu machen. Dadurch ist es besonders relevant für Executives, Gründerinnen und Gründer, selbstständig arbeitende High-Agency-Professionals sowie kleine Unternehmen, die jeder Mitarbeiterin und jedem Mitarbeiter ein personalisiertes digitales Sekretariat bereitstellen möchten.

## Roadmap-Zusammenfassung

### Gelieferte Basis

1. Fundament: App-Shell, Auth, Lokalisierung, Landing Page und Workspace-Struktur.
2. Chat: persistenter, Retrieval-gestützter Assistent und globales Widget.
3. Benachrichtigungen: Echtzeit-Inbox und LLM-generierte Nachrichten.
4. Wissensbasis: Dokumentenaufnahme, Vektor-Retrieval und persönliche Informationen.
5. Executive-Workflow: Kontakte, Meetings, Aufgaben, Reports und Home-Briefing.
6. Chief-of-Staff-Layer: Entscheidungslog, Briefings, Meeting-Prep-Packs, Post-Meeting-Capture, Interaktionshistorie und proaktive Nudges.
7. SaaS-Launch-Layer: Onboarding, Admin-Tools und teilweise Rate Limiting.
8. UI/UX-Polish: Kontaktfreigabe-Links, getrennte Einstellungen und Produkt-Polish.
9. Integrationen und geplanter Agent-Layer: Google-Calendar-Sync, Cron-basierte Briefings und Follow-ups.
10. Hardening: zentrale Zuverlässigkeitslücken für Produktion adressiert, darunter Sync-Batching, Pagination, Token-Revocation-Handling und Zod-basierte CRUD-Validierung.

### Nächste Prioritäten

1. Produktions-Hardening für verbleibende UX-, Zeitzonen- und Environment-Validierungslücken abschließen.
2. Integrationen über Google Calendar hinaus ausbauen.
3. Billing- und Subscription-Lifecycle ergänzen.
4. Infrastruktur für transaktionale E-Mails hinzufügen.
5. Qualität, Vertrauenswürdigkeit und Hygiene der Automatisierung weiter verbessern.

### Langfristige Chance

- See-Sweet zu einer ausgereiften persönlichen Chief-of-Staff-Plattform weiterentwickeln.
- Assistenzgesteuerte Workflow-Ausführung vertiefen, bei kritischen Schreiboperationen aber Nutzerbestätigung beibehalten.
- Perspektivisch von rein persönlicher Nutzung zu delegierten oder teamunterstützten Workflows erweitern.

## Vorgeschlagene PowerPoint-Struktur

### Folie 1: Titel

See-Sweet: Ein privates KI Executive Secretariat

### Folie 2: Die Vision

Ein KI-Workspace, der einer einzelnen Person die Hebelwirkung eines Chief of Staff gibt.

### Folie 3: Das Problem

Die meisten KI-Tools beantworten Prompts, bewahren aber keine Kontinuität über Meetings, Kontakte, Aufgaben, Entscheidungen und Dokumente hinweg.

### Folie 4: Die Lösung

See-Sweet verbindet Chat, Retrieval, strukturierte Workflow-Daten, Integrationen und proaktive Unterstützung in einem privaten, anpassbaren Workspace, der mehrere getrennte Tools ersetzen kann.

### Folie 5: Kernfähigkeiten

Chat, Wissensbasis, Kontakte, Meetings, Aufgaben, Entscheidungen, Reports, Benachrichtigungen, Briefings und Integrationen in einem anpassbaren System statt in einem Flickenteppich aus Einzel-Tools.

### Folie 6: Warum das Produkt anders ist

Privat, verankert, workflow-bewusst, mehrsprachig und auf operative Hebelwirkung statt Neuheit ausgerichtet.

### Folie 7: Technologie-Stack

Next.js, React, TypeScript, PostgreSQL, pgvector, Prisma, Better Auth, Zod, Ollama, SSE, Docker.

### Folie 8: Architektur

Authentifizierter, nutzerspezifischer Workspace, modulare Server-Logik, Retrieval-gestützte KI und geplante Automatisierung.

### Folie 9: Aktueller Reifegrad

Das Kernprodukt funktioniert bereits über Executive-Workflows, Wissens-Retrieval, Benachrichtigungen, Integrationen und Onboarding hinweg.

### Folie 10: Roadmap

Produktions-Hardening, Billing, E-Mail, weitere Integrationen und tiefere Chief-of-Staff-Automatisierung.

### Folie 11: Schlussbotschaft

See-Sweet soll zu einer verlässlichen privaten Betriebsebene für wertvolle individuelle Wissensarbeit werden.

## Presenter Notes

- Betonen, dass das Produkt kein weiterer Chatbot ist.
- Die Formulierung private executive secretariat konsistent verwenden.
- Klar zwischen bereits umgesetzt und noch geplant unterscheiden.
- Privatsphäre, verankerter Kontext und operative Hebelwirkung als Kern der Geschichte hervorheben.
