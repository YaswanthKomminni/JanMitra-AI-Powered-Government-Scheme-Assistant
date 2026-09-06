# Base Paper Identification & Submission Document
**Course:** 23CSE471 – Natural Language Processing  
**Review:** Case Study Review 2 / Project Base Paper Submission  
**Team Number:** 9  
**Project Title:** JanMitra: AI-Powered Government Scheme Assistant (Agricultural & Welfare Assistance)  
**Team Members:**
- Komminni Yaswanth (CB.SC.U4CSE24024)
- P J Abhiram (CB.SC.U4CSE24039)
- S. Sai Sumalik (CB.SC.U4CSE24647)
- Vutla Charan (CB.SC.U4CSE24258)
**Faculty / Guide:** Dr. T Senthil Kumar (Department of Computer Science and Engineering)

---

## 1. Selected Standard Base Paper (Agricultural AI & Conversational Assistance)

| Attribute | Details |
| :--- | :--- |
| **Paper Title** | **AI-based agricultural chatbots for sustainable farming: A systematic review** |
| **Authors** | Petros Theofilou, Avi Arampatzis |
| **Journal Name** | **Computers and Electronics in Agriculture** |
| **Publisher** | Elsevier |
| **Publication Details** | Volume 213, Article 108252 (2023 / 2024) |
| **DOI** | [10.1016/j.compag.2023.108252](https://doi.org/10.1016/j.compag.2023.108252) |
| **Direct ScienceDirect Link** | [https://www.sciencedirect.com/science/article/pii/S016816992300624X](https://www.sciencedirect.com/science/article/pii/S016816992300624X) |

---

## 2. SCImago Journal Rank (SJR) Verification

*   **Journal:** *Computers and Electronics in Agriculture*
*   **SCImago Direct Profile URL:** [https://www.scimagojr.com/journalsearch.php?q=25964&tip=sid&clean=0](https://www.scimagojr.com/journalsearch.php?q=25964&tip=sid&clean=0)
*   **SCImago Search URL:** [https://www.scimagojr.com/journalsearch.php?q=Computers+and+Electronics+in+Agriculture](https://www.scimagojr.com/journalsearch.php?q=Computers+and+Electronics+in+Agriculture)
*   **ISSN:** 0168-1699
*   **SCImago Quartile:** **Q1** *(Ranked in the top tier globally across Computer Science Applications and Agricultural Sciences)*
*   **SCImago Journal Rank (SJR):** **2.18**
*   **H-Index:** **206**
*   **Subject Categories:** 
    *   Agronomy and Crop Science (**Q1**)
    *   Computer Science Applications (**Q1**)
    *   Electrical and Electronic Engineering (**Q1**)

---

## 3. Paper Abstract & Alignment with JanMitra

### Abstract Summary
The paper presents an extensive state-of-the-art review and architectural taxonomy of Artificial Intelligence (AI) and Natural Language Processing (NLP) conversational agents designed for farmers. Smallholder farmers often struggle to navigate complex digital platforms, access government agricultural subsidies, and diagnose crop needs due to digital literacy and language barriers. The paper systematically investigates:
1.  **Conversational Architectures in Agriculture:** Natural Language Understanding (NLU), intent classification, entity extraction, and dialogue management tailored to rural farmers.
2.  **Multilingual & Voice-Based Accessibility:** The imperative of speech-to-text and voice interfaces to overcome illiteracy and rural linguistic diversity.
3.  **Advisory & Welfare Recommendation:** How automated decision-support systems deliver real-time guidance on government farming schemes, credit facilities, and agronomic practices.

### Direct Problem Alignment with JanMitra:
*   **The Rural Digital Divide:** In India, millions of farmers miss out on flagship schemes like **PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)**, **PMFBY (Crop Insurance)**, and **Kisan Credit Card (KCC)** due to confusing portals and middlemen.
*   **Voice-First Requirement:** Rural farmers require speech-driven interaction in their mother tongue (Telugu, Hindi, Tamil, Kannada, Bengali).
*   **Accurate Guidance (Zero Hallucination):** Farmers cannot afford misinformation regarding subsidy amounts or eligibility criteria, requiring grounded Retrieval-Augmented Generation (RAG).

---

## 4. Technical Architecture: Base Paper vs. JanMitra Implementation

| Functional Component | Base Paper Architecture (*Theofilou & Arampatzis, COMPAG*) | JanMitra Architecture (Our Implementation) |
| :--- | :--- | :--- |
| **Target Audience** | Agricultural producers & smallholder farmers | Indian farmers & rural citizens (20% farmer demographic in dataset) |
| **Primary Domain** | General farming advice & agricultural guidance | **Indian Government Welfare Schemes** (PM-KISAN, PMFBY, KCC, Soil Health, etc. across 4,706 schemes) |
| **Language Coverage** | Primarily English and localized pilot languages | **Multilingual (6 regional languages text, 10 regional languages speech)** |
| **NLU Model** | Rule-based / Early Transformer slot fillers | **XLM-RoBERTa / IndicBERT / mBERT** fine-tuned on 6,000 annotated scheme queries |
| **Knowledge Base** | Unstructured agronomic FAQs and manuals | **4,706 structured schemes** (JSON/CSV) scraped from myScheme.gov.in |
| **Recommendation** | Static threshold filtering | **Personalized Multi-Label Recommendation Engine** (10,000 citizen profiles with age, land, income, caste, state) |
| **Retrieval Engine** | Keyword search / BM25 | **Dense Vector Embeddings + FAISS / ChromaDB + RAG** |
| **Input Modality** | Text / Early voice prompts | **Voice-First: Spoken Language Identification (SLID) across 10 Indian languages (Wav2Vec2 / CNN)** |

---

## 5. Secondary SCImago Q1 Journal (Alternative for Agro-Tech)
If an additional paper from a specialized smart agriculture journal is required:

*   **Journal Name:** **Smart Agricultural Technology** (Elsevier)
*   **SCImago Listing Link:** [https://www.scimagojr.com/journalsearch.php?q=Smart+Agricultural+Technology](https://www.scimagojr.com/journalsearch.php?q=Smart+Agricultural+Technology)
*   **ISSN:** 2772-3755
*   **SCImago Quartile:** **Q1** (SJR: 1.48)
*   **Focus:** Conversational AI, Internet of Things (IoT), and smart mobile advisory services for agricultural decision-making.

---

## 6. Real-World Benchmark: Government of India's *Kisan e-Mitra*
Our project architecture directly replicates and expands upon the Government of India's Ministry of Agriculture initiative:
*   **Kisan e-Mitra (AI Chatbot for PM-KISAN):** A voice-based AI assistant powered by Bhashini and NLP that addresses farmer queries regarding PM-KISAN installments, eligibility, and grievance redressal in multiple regional languages.
*   **JanMitra Advantage:** While Kisan e-Mitra is limited primarily to PM-KISAN, JanMitra integrates **4,706 centralized and state-level welfare programs**, multi-label eligibility matching, and multi-lingual voice classification.
