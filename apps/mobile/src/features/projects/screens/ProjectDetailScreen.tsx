import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NoteComposer, type NoteComposerPayload } from "../components/NoteComposer";
import { useAuthStore } from "../../../store";
import { useProjectStore } from "../../../store/projectStore";
import { projectApi } from "../../../services/api/project.api";
import { 
  fetchNotesWithCache, 
  fetchTasksWithCache, 
  createNoteOffline, 
  createTaskOffline, 
  updateTaskOffline, 
  deleteTaskOffline 
} from "../../../offline/sync/sync-engine";
import { type ProjectNoteDTO, type ProjectTaskDTO, type ProjectDTO } from "../../../services/api/project.api";
import { radius, spacing, typography, useThemedStyles, type AppColors } from "../../../shared/theme";
import { useThemeColors } from "../../../shared/theme/ThemeProvider";
import {
  DesignBackHeader,
  ErrorState,
  Screen,
} from "../../../shared/ui";
import { useTranslation, useLocaleCode } from "../../../shared/i18n";
import { PERMISSIONS, useCan } from "../../../shared/permissions";

type TabKey = "notes" | "todos";

function formatDate(value: string, locale: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function ProjectDetailScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useThemeColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string; tab?: string }>();
  const projectId = params.projectId ?? "";
  const initialTab: TabKey =
    params.tab === "todos" ? "todos" : "notes";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [query, setQuery] = useState("");
  const { projects } = useProjectStore();
  const [loadedProject, setLoadedProject] = useState<ProjectDTO | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    const fromStore = projects.find((item) => item.id === projectId);
    if (fromStore) {
      setLoadedProject(null);
      return;
    }

    setProjectLoading(true);
    projectApi.getProject(projectId)
      .then((data) => setLoadedProject(data))
      .catch(() => setLoadedProject(null))
      .finally(() => setProjectLoading(false));
  }, [projectId, projects]);

  const project = useMemo(
    () => projects.find((item) => item.id === projectId) ?? loadedProject,
    [projectId, projects, loadedProject],
  );
  const { t } = useTranslation();
  const locale = useLocaleCode();
  const { user } = useAuthStore();
  const canManageTodos = useCan(PERMISSIONS.PROJECT_TASK_MANAGE);

  useEffect(() => {
    if (params.tab === "todos" || params.tab === "notes") {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  const tabItems = useMemo(
    () => [
      { key: "notes" as const, label: t("projects.tabs.notes") },
      { key: "todos" as const, label: t("projects.tabs.todos") },
    ],
    [t],
  );
  const [notes, setNotes] = useState<ProjectNoteDTO[]>([]);
  const [todos, setTodos] = useState<ProjectTaskDTO[]>([]);

  const [newTodoText, setNewTodoText] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");

  const fetchNotes = async () => {
    if (!projectId) return;
    try {
      const data = await fetchNotesWithCache(projectId);
      setNotes(data);
    } catch {}
  };

  const fetchTodos = async () => {
    if (!projectId) return;
    try {
      const data = await fetchTasksWithCache(projectId);
      setTodos(data);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotes();
      fetchTodos();
    }, [projectId])
  );

  const q = query.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!q) return null;
    const results: Array<{ kind: "note" | "todos"; label: string; sub: string; key: string }> = [];

    notes.forEach((n) => {
      if (n.content.toLowerCase().includes(q) || n.author.fullName.toLowerCase().includes(q)) {
        results.push({ kind: "note", label: n.author.fullName, sub: n.content, key: n.id });
      }
    });

    todos.forEach((todo) => {
      if (todo.title.toLowerCase().includes(q)) {
        results.push({
          kind: "todos",
          label: todo.title,
          sub:
            todo.status === "completed"
              ? t("projects.todos.statusCompleted")
              : t("projects.todos.statusWaiting"),
          key: todo.id,
        });
      }
    });

    return results;
  }, [q, notes, todos, t]);

  if (projectLoading) {
    return (
      <Screen scroll={false}>
        <DesignBackHeader
          fallbackRoute="/(main)/(tabs)/projects"
          title={t("projects.detail.title")}
        />
        <ErrorState message={t("projects.detail.loading")} title={t("states.loading")} />
      </Screen>
    );
  }

  if (!project) {
    return (
      <Screen>
        <DesignBackHeader
          fallbackRoute="/(main)/(tabs)/projects"
          title={t("projects.detail.title")}
        />
        <ErrorState message={t("projects.detail.notFound")} title={t("states.error")} />
      </Screen>
    );
  }

  const kindIcon: Record<string, string> = {
    note: "note-outline",
    todos: "checklist",
  };

  const sendNote = async ({ body, attachments }: NoteComposerPayload) => {
    if (!body && attachments.length === 0) return;
    if (!user) return;
    try {
      await createNoteOffline(projectId, body || t("projects.detail.attachedNote"), { id: user.id, fullName: user.fullName });
      await fetchNotes();
    } catch {}
  };

  const handleAddTodo = async () => {
    const text = newTodoText.trim();
    if (!text) return;
    if (!user) return;
    try {
      await createTaskOffline(projectId, { title: text, status: "todo", priority: "medium" }, { id: user.id, fullName: user.fullName });
      setNewTodoText("");
      await fetchTodos();
    } catch {}
  };

  const handleToggleTodo = async (todo: ProjectTaskDTO) => {
    const previousStatus = todo.status;
    const newStatus = previousStatus === "completed" ? "todo" : "completed";

    setTodos((items) =>
      items.map((item) =>
        item.id === todo.id
          ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
          : item,
      ),
    );

    try {
      const updated = await updateTaskOffline(projectId, todo.id, { status: newStatus });
      if (updated) {
        setTodos((items) => items.map((item) => (item.id === todo.id ? updated : item)));
      }
    } catch {
      setTodos((items) =>
        items.map((item) =>
          item.id === todo.id
            ? { ...item, status: previousStatus, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.wrapper}>
      {/* Sabit üst bölüm: başlık + arama + sekmeler */}
      <View style={styles.headerBlock}>
        <DesignBackHeader
          fallbackRoute="/(main)/(tabs)/projects"
          badge={
            project.status === "completed"
              ? { label: t("status.completed"), variant: "info" }
              : { label: t("status.active"), variant: "success" }
          }
          subtitle={project.customerName || undefined}
          title={project.name}
        />

        <View style={styles.searchWrap}>
          <MaterialCommunityIcons color={colors.textMuted} name="magnify" size={20} style={styles.searchIcon} />
          <TextInput
            onChangeText={setQuery}
            placeholder={t("projects.detail.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")}>
              <MaterialCommunityIcons color={colors.textMuted} name="close-circle" size={18} />
            </Pressable>
          ) : null}
        </View>

        {searchResults !== null ? (
          <View style={styles.searchResults}>
            {searchResults.length === 0 ? (
              <View style={styles.noResult}>
                <MaterialCommunityIcons color={colors.textMuted} name="magnify-close" size={28} />
                <Text style={styles.noResultText}>{t("projects.detail.noResults")}</Text>
              </View>
            ) : (
              searchResults.map((r) => (
                <View key={r.key} style={styles.resultRow}>
                  <View style={styles.resultIconWrap}>
                    <MaterialCommunityIcons color={colors.primary} name={kindIcon[r.kind] as "note-outline"} size={18} />
                  </View>
                  <View style={styles.resultBody}>
                    <Text style={styles.resultLabel}>{r.label}</Text>
                    <Text numberOfLines={1} style={styles.resultSub}>{r.sub}</Text>
                  </View>
                  <Text style={styles.resultKind}>
                    {r.kind === "note"
                      ? t("projects.notes.kind")
                      : t("projects.todos.kind")}
                  </Text>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.tabs}>
            {tabItems.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* İçerik alanı — kalan yüksekliği doldurur, üstten hizalı */}
      {searchResults === null ? (
        activeTab === "notes" ? (
          <View style={styles.notesBody}>
            <ScrollView
              contentContainerStyle={styles.chatScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scrollFill}
            >
              {notes.length === 0 ? (
                <View style={styles.emptyNotes}>
                  <MaterialCommunityIcons color={colors.textMuted} name="note-text-outline" size={40} />
                  <Text style={styles.emptyNotesText}>{t("projects.notes.empty")}</Text>
                </View>
              ) : (
                [...notes].reverse().map((note) => {
                  const isMine = note.authorId === user?.id;
                  return (
                  <View key={note.id} style={[styles.chatRow, isMine && styles.chatRowMine]}>
                    <View style={[styles.chatBubble, isMine ? styles.chatBubbleMine : styles.chatBubbleOther]}>
                        {!isMine && (
                          <Text style={styles.chatAuthor}>{note.author.fullName}</Text>
                        )}
                        {note.content ? (
                          <Text style={[styles.chatText, isMine && styles.chatTextMine]}>
                            {note.content}
                          </Text>
                        ) : null}
                        <Text style={[styles.chatTime, isMine && styles.chatTimeMine]}>
                          {formatDate(note.createdAt, locale)}
                        </Text>
                      </View>
                  </View>
                )})
              )}
            </ScrollView>

            <NoteComposer onSend={sendNote} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.otherTabContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scrollFill}
          >
              {activeTab === "todos" ? (
                <View>
                  {canManageTodos ? (
                    <View style={styles.addTodoRow}>
                      <TextInput
                        onChangeText={setNewTodoText}
                        onSubmitEditing={handleAddTodo}
                        placeholder={t("projects.todos.addPlaceholder")}
                        placeholderTextColor={colors.textMuted}
                        style={styles.addTodoInput}
                        value={newTodoText}
                      />
                      <Pressable
                        onPress={handleAddTodo}
                        style={styles.addTodoBtn}
                      >
                        <MaterialCommunityIcons color={colors.white} name="plus" size={20} />
                      </Pressable>
                    </View>
                  ) : null}

                  {todos.length === 0 ? (
                    <View style={styles.emptyNotes}>
                      <MaterialCommunityIcons color={colors.textMuted} name="clipboard-text-outline" size={40} />
                      <Text style={styles.emptyNotesText}>{t("projects.todos.empty")}</Text>
                    </View>
                  ) : (
                    todos.map((todo) => (
                      <View key={todo.id} style={styles.todoRow}>
                        <Pressable
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: todo.status === "completed" }}
                          hitSlop={8}
                          onPress={() => handleToggleTodo(todo)}
                          style={styles.todoToggleArea}
                        >
                          <View style={[styles.todoCheckbox, todo.status === "completed" && styles.todoCheckboxDone]}>
                            {todo.status === "completed" ? (
                              <MaterialCommunityIcons color={colors.white} name="check" size={16} />
                            ) : null}
                          </View>

                          {editingTodoId === todo.id ? (
                            <TextInput
                              autoFocus
                              onChangeText={setEditingTodoText}
                              onSubmitEditing={async () => {
                                const text = editingTodoText.trim();
                                if (text) {
                                  try {
                                    await updateTaskOffline(projectId, todo.id, { title: text });
                                    await fetchTodos();
                                  } catch {}
                                }
                                setEditingTodoId(null);
                              }}
                              style={styles.todoEditInput}
                              value={editingTodoText}
                            />
                          ) : (
                            <Text style={[styles.todoText, todo.status === "completed" && styles.todoTextDone]}>
                              {todo.title}
                            </Text>
                          )}
                        </Pressable>

                        {canManageTodos ? (
                          <View style={styles.todoActions}>
                            {editingTodoId === todo.id ? (
                              <Pressable
                                onPress={async () => {
                                  const text = editingTodoText.trim();
                                  if (text) {
                                    try {
                                      await updateTaskOffline(projectId, todo.id, { title: text });
                                      await fetchTodos();
                                    } catch {}
                                  }
                                  setEditingTodoId(null);
                                }}
                                style={styles.todoActionBtn}
                              >
                                <MaterialCommunityIcons color={colors.success} name="check" size={18} />
                              </Pressable>
                            ) : (
                              <Pressable
                                onPress={() => {
                                  setEditingTodoId(todo.id);
                                  setEditingTodoText(todo.title);
                                }}
                                style={styles.todoActionBtn}
                              >
                                <MaterialCommunityIcons color={colors.primaryLight} name="pencil-outline" size={18} />
                              </Pressable>
                            )}
                            <Pressable
                              onPress={async () => {
                                try {
                                  await deleteTaskOffline(projectId, todo.id);
                                  await fetchTodos();
                                } catch {}
                              }}
                              style={styles.todoActionBtn}
                            >
                              <MaterialCommunityIcons color={colors.danger} name="delete-outline" size={18} />
                            </Pressable>
                          </View>
                        ) : null}
                      </View>
                    ))
                  )}
                </View>
              ) : null}
          </ScrollView>
        )
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBlock: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  notesBody: {
    flex: 1,
  },
  scrollFill: {
    flex: 1,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    minHeight: 48,
    gap: spacing.sm,
  },
  searchIcon: { opacity: 0.7 },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  searchResults: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  noResult: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  noResultText: { ...typography.body, color: colors.textMuted },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  resultBody: { flex: 1 },
  resultLabel: { ...typography.bodySmall, color: colors.text, fontWeight: "600" },
  resultSub: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  resultKind: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: colors.cardSoft,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
  tabTextActive: { color: colors.white },
  chatScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  emptyNotes: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyNotesText: {
    ...typography.body,
    color: colors.textMuted,
  },
  chatRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  chatRowMine: {
    justifyContent: "flex-end",
  },
  chatBubble: {
    maxWidth: "80%",
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chatBubbleOther: {
    backgroundColor: colors.cardSoft,
    borderTopLeftRadius: 2,
  },
  chatBubbleMine: {
    backgroundColor: `${colors.primary}22`,
    borderTopRightRadius: 2,
  },
  chatAuthor: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  chatText: {
    ...typography.bodySmall,
    color: colors.textSoft,
    lineHeight: 20,
  },
  chatTextMine: {
    color: colors.text,
  },
  chatTime: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    alignSelf: "flex-end",
  },
  chatTimeMine: {
    color: `${colors.textMuted}cc`,
  },
  otherTabContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  addTodoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addTodoInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  addTodoBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  todoCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  todoToggleArea: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  todoCheckboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  todoText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
  },
  todoTextDone: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  todoEditInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  todoActions: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  todoActionBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },

});
}
