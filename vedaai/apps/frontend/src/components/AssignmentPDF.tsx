import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Assignment, Section, Question } from "@vedaai/types";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    paddingBottom: 15,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerInfo: {
    fontSize: 10,
    marginBottom: 3,
    color: "#333",
  },
  studentBox: {
    borderWidth: 1,
    borderColor: "#000",
    padding: 15,
    marginBottom: 25,
    marginTop: 20,
  },
  studentLine: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  studentLabel: {
    width: 100,
    fontWeight: "bold",
    fontSize: 11,
  },
  studentBlank: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    minHeight: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  sectionInstruction: {
    fontSize: 10,
    fontStyle: "italic",
    color: "#333",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  questionContainer: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  questionText: {
    marginBottom: 6,
    lineHeight: 1.5,
    fontWeight: "500",
  },
  questionMeta: {
    fontSize: 9,
    color: "#555",
    marginBottom: 6,
  },
  optionContainer: {
    marginLeft: 15,
    marginBottom: 4,
    fontSize: 10,
  },
  answerContainer: {
    marginTop: 6,
    padding: 8,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 4,
  },
  answerLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#166534",
    marginBottom: 2,
  },
  answerText: {
    fontSize: 10,
    color: "#166534",
  },
  pageNumber: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    color: "#888",
  },
});

function QuestionBlock({
  question,
  index,
  showAnswer,
}: {
  question: Question;
  index: number;
  showAnswer?: boolean;
}) {
  const labels = ["a", "b", "c", "d"];
  return (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>
        {index}. {question.text}
      </Text>
      <Text style={styles.questionMeta}>
        [{question.marks} marks] | {question.difficulty}
      </Text>
      {question.type === "mcq" && question.options && (
        <View>
          {question.options.map((opt, i) => (
            <Text key={opt.id} style={styles.optionContainer}>
              {labels[i]}) {opt.text}
            </Text>
          ))}
        </View>
      )}
      {showAnswer && question.answer && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerLabel}>Answer:</Text>
          <Text style={styles.answerText}>{question.answer}</Text>
        </View>
      )}
    </View>
  );
}

function SectionBlock({
  section,
  showAnswer,
}: {
  section: Section;
  showAnswer?: boolean;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>
        {section.title} [{section.totalMarks} marks]
      </Text>
      <Text style={styles.sectionInstruction}>{section.instruction}</Text>
      {section.questions.map((q, i) => (
        <QuestionBlock
          key={q.id}
          question={q}
          index={i + 1}
          showAnswer={showAnswer}
        />
      ))}
    </View>
  );
}

export function AssignmentPDFDocument({
  assignment,
  title,
  showAnswerKey = false,
}: {
  assignment: Assignment;
  title?: string;
  showAnswerKey?: boolean;
}) {
  const displayTitle = title || assignment.metadata.topic;
  const totalMarks = assignment.sections.reduce(
    (sum, s) => sum + s.totalMarks,
    0
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>Delhi Public School, Sector-4</Text>
          <Text style={styles.title}>
            {displayTitle}
            {showAnswerKey ? " - Answer Key" : ""}
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <Text style={styles.headerInfo}>
              Subject: {assignment.metadata.subject}
            </Text>
            <Text style={styles.headerInfo}>
              Class: {assignment.metadata.gradeLevel}
            </Text>
            <Text style={styles.headerInfo}>Max Marks: {totalMarks}</Text>
          </View>
        </View>

        {!showAnswerKey && (
          <View style={styles.studentBox}>
            <View style={styles.studentLine}>
              <Text style={styles.studentLabel}>Name:</Text>
              <Text style={styles.studentBlank}></Text>
            </View>
            <View style={styles.studentLine}>
              <Text style={styles.studentLabel}>Roll Number:</Text>
              <Text style={styles.studentBlank}></Text>
            </View>
            <View style={styles.studentLine}>
              <Text style={styles.studentLabel}>Section:</Text>
              <Text style={styles.studentBlank}></Text>
            </View>
          </View>
        )}

        {showAnswerKey && (
          <View
            style={{
              marginBottom: 20,
              padding: 10,
              backgroundColor: "#f0fdf4",
              borderWidth: 1,
              borderColor: "#86efac",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: "#166534",
                textAlign: "center",
              }}
            >
              CONFIDENTIAL - Answer Key
            </Text>
          </View>
        )}

        {assignment.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            showAnswer={showAnswerKey}
          />
        ))}

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}