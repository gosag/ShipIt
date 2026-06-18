import React, { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FolderKanban, MessageSquare, GripVertical } from "lucide-react";

type Priority = "urgent" | "high" | "medium";

interface Card {
  id: string;
  title: string;
  priority: Priority;
  initials: string;
  forYou?: boolean;
  unread?: number;
}

interface Column {
  id: string;
  name: string;
  cards: Card[];
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const initialColumns: Column[] = [
  {
    id: "todo",
    name: "To Do",
    cards: [
      { id: "c1", title: "Design onboarding flow", priority: "high", initials: "GG", forYou: true },
      { id: "c2", title: "Set up CI pipeline", priority: "medium", initials: "AK" },
    ],
  },
  {
    id: "inprogress",
    name: "In Progress",
    cards: [
      { id: "c3", title: "Fix realtime socket drop", priority: "urgent", initials: "GG", unread: 3 },
      { id: "c4", title: "Build dashboard widgets", priority: "high", initials: "MR" },
    ],
  },
  {
    id: "review",
    name: "In Review",
    cards: [
      { id: "c5", title: "Code review for new feature", priority: "high", initials: "JD" },
    ],
  },
  {
    id: "done",
    name: "Done",
    cards: [
      { id: "c6", title: "Workspace invites", priority: "medium", initials: "AK" },
    ],
  },
];

const priorityStyles: Record<Priority, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const CardContent: React.FC<{ card: Card; isDragging?: boolean }> = ({
  card,
  isDragging = false,
}) => (
  <div
    className={`rounded-lg border bg-[#111113] p-3 transition-shadow ${
      isDragging
        ? "border-[#7f77dd]/60 shadow-lg shadow-[#7f77dd]/10 opacity-90"
        : "border-[#2a2a2c]"
    }`}
  >
    <p className="mb-3 text-[11px] sm:text-sm font-medium text-zinc-200 leading-snug">
      {card.title}
    </p>
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1 flex-wrap">
        <span
          className={`rounded border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium capitalize ${priorityStyles[card.priority]}`}
        >
          {card.priority}
        </span>
        {card.forYou && (
          <span className="rounded border border-[#7f77dd]/40 bg-[#7f77dd]/15 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-[#a39bff]">
            You
          </span>
        )}
      </div>
      <div className="relative flex items-center gap-1 shrink-0">
        <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-500" />
        {card.unread ? (
          <span className="absolute -right-2 -top-2 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-medium text-white">
            {card.unread}
          </span>
        ) : null}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Sortable card wrapper                                               */
/* ------------------------------------------------------------------ */
const SortableCard: React.FC<{ card: Card }> = ({ card }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    cursor: isDragging ? "grabbing" : "grab",
    // critical for mobile — prevents browser from intercepting touch events
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
    >
      <CardContent card={card} />
    </div>
  );
};

const DroppableColumn: React.FC<{ column: Column; isOver: boolean }> = ({
  column,
  isOver,
}) => {
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      className={`flex flex-col gap-2 sm:gap-3 rounded-lg p-1.5 sm:p-2 transition-colors duration-150 min-w-0 ${
        isOver ? "bg-[#7f77dd]/6 ring-1 ring-[#7f77dd]/25" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] sm:text-xs font-semibold text-zinc-300 truncate pr-1">
          {column.name}
        </span>
        <span className="text-[10px] sm:text-xs text-zinc-500 shrink-0">
          {column.cards.length}
        </span>
      </div>

      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="flex flex-col gap-2 sm:gap-3 overflow-y-auto max-h-48 sm:max-h-60 md:max-h-72 custom-scrollbar"
        >
          <AnimatePresence initial={false}>
            {column.cards.map((card) => (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <SortableCard card={card} />
              </motion.div>
            ))}
          </AnimatePresence>

          {column.cards.length === 0 && (
            <div
              className={`rounded-lg border-2 border-dashed py-4 sm:py-6 text-center text-[10px] sm:text-xs transition-colors ${
                isOver
                  ? "border-[#7f77dd]/50 text-[#7f77dd]/70"
                  : "border-[#2a2a2c] text-zinc-600"
              }`}
            >
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export const KanbanMockup: React.FC<{ withSidebar?: boolean }> = ({
  withSidebar = true,
}) => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // ✅ MouseSensor + TouchSensor instead of PointerSensor
  // TouchSensor with delay lets mobile distinguish scroll vs drag
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,   // hold 250ms to start drag
        tolerance: 5, // allow 5px finger wobble during hold
      },
    })
  );

  /* helpers */
  const findColumnByCardId = (cardId: string) =>
    columns.find((col) => col.cards.some((c) => c.id === cardId));

  const findColumnById = (colId: string) =>
    columns.find((col) => col.id === colId);

  /* drag start */
  const handleDragStart = ({ active }: DragStartEvent) => {
    const col = findColumnByCardId(active.id as string);
    const card = col?.cards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
      setHasInteracted(true);
    }
  };

  /* drag over — handles cross-column moves in real time */
  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) { setOverColumnId(null); return; }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCol = findColumnByCardId(activeId);
    if (!activeCol) return;

    const overCol = findColumnByCardId(overId) ?? findColumnById(overId);
    if (!overCol) return;

    setOverColumnId(overCol.id);

    if (activeCol.id === overCol.id) return;

    setColumns((prev) => {
      const srcIdx = prev.findIndex((c) => c.id === activeCol.id);
      const dstIdx = prev.findIndex((c) => c.id === overCol.id);
      if (srcIdx === -1 || dstIdx === -1) return prev;

      const card = prev[srcIdx].cards.find((c) => c.id === activeId)!;
      const overCardIdx = prev[dstIdx].cards.findIndex((c) => c.id === overId);
      const insertAt = overCardIdx >= 0 ? overCardIdx : prev[dstIdx].cards.length;

      return prev.map((col, i) => {
        if (i === srcIdx) return { ...col, cards: col.cards.filter((c) => c.id !== activeId) };
        if (i === dstIdx) {
          const newCards = [...col.cards];
          newCards.splice(insertAt, 0, card);
          return { ...col, cards: newCards };
        }
        return col;
      });
    });
  };

  /* drag end */
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCard(null);
    setOverColumnId(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setColumns((prev) =>
      prev.map((col) => {
        const aIdx = col.cards.findIndex((c) => c.id === activeId);
        const oIdx = col.cards.findIndex((c) => c.id === overId);
        if (aIdx === -1 || oIdx === -1) return col;
        return { ...col, cards: arrayMove(col.cards, aIdx, oIdx) };
      })
    );
  };

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="overflow-hidden rounded-xl border border-[#2a2a2c] bg-[#1a1a1c] shadow-2xl"
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-[#2a2a2c] px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500/70" />
          <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-green-500/70" />
        </div>

        {/* Hint — fades out after first interaction */}
        <AnimatePresence>
          {!hasInteracted && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-[#7f77dd]/30 bg-[#7f77dd]/10 px-2 sm:px-3 py-0.5 sm:py-1"
            >
              <GripVertical className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#a39bff]" />
              <span className="text-[9px] sm:text-[11px] font-medium text-[#a39bff] whitespace-nowrap">
                Hold to drag
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-12 sm:w-16" />
      </div>

      <div className="flex">
        {/* Sidebar — hidden on mobile, visible sm+ */}
        {withSidebar && (
          <aside className="hidden w-40 sm:w-48 shrink-0 border-r border-[#2a2a2c] p-3 sm:p-4 sm:block">
            <div className="mb-3 sm:mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-[#534ab7] text-[10px] sm:text-xs font-bold text-white">
                S
              </div>
              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                Acme Team
              </span>
            </div>
            <p className="mb-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Projects
            </p>
            <ul className="space-y-1 text-xs sm:text-sm">
              {["Product", "Marketing", "Design"].map((p, i) => (
                <li
                  key={p}
                  className={`flex items-center gap-1.5 sm:gap-2 rounded-md px-2 py-1 sm:py-1.5 ${
                    i === 0 ? "bg-[#7f77dd]/15 text-white" : "text-zinc-400"
                  }`}
                >
                  <FolderKanban className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span className="truncate">{p}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* 
            Mobile: 2 columns with horizontal scroll for overflow
            Desktop: 4 columns in a grid
          */}
          <div className="flex-1 overflow-x-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 min-w-0">
              {columns.map((col) => (
                <DroppableColumn
                  key={col.id}
                  column={col}
                  isOver={overColumnId === col.id}
                />
              ))}
            </div>
          </div>

          {/* Floating card while dragging */}
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
            {activeCard ? (
              <div className="rotate-1 scale-105 w-36 sm:w-auto">
                <CardContent card={activeCard} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </motion.div>
  );
};

export default KanbanMockup;