import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit,
  File as FileIcon,
  Folder,
  Moon,
  RotateCcw,
  Save,
  Sun,
} from "lucide-react";

type RenameCaseMode = "keep" | "lower" | "upper" | "camel";
type SortMode = "alpha" | "extension" | "prefixMatch" | "suffixMatch";

type FileRecord = {
  handle: FileSystemFileHandle;
  name: string;
  size: number;
};

type PreviewItem = {
  file: FileRecord;
  extension: string;
  newName: string;
  changed: boolean;
  selected: boolean;
  willApply: boolean;
};

type RenameSettings = {
  prefix: string;
  suffix: string;
  search: string;
  replace: string;
  useRegex: boolean;
  regexFlags: string;
  caseMode: RenameCaseMode;
  enableSequence: boolean;
  sequenceStart: number;
  sequencePad: number;
  sequenceSeparator: string;
  sequenceBase: string;
  sequenceKeepStem: boolean;
  templateEnabled: boolean;
  template: string;
};

type ApplyScope = "all" | "selected";

type RenameOperation = {
  from: string;
  to: string;
};

type Preset = {
  id: string;
  name: string;
  settings: RenameSettings;
};

type MoveToSubFolderResult = {
  moved: boolean;
  reason: "exists" | null;
};

type SelectedDirectory = {
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
};

const MAX_SELECTED_DIRECTORIES = 10;

const PRESETS_STORAGE_KEY = "rename_tool_presets_v1";

const defaultSettings: RenameSettings = {
  prefix: "",
  suffix: "",
  search: "",
  replace: "",
  useRegex: false,
  regexFlags: "g",
  caseMode: "keep",
  enableSequence: false,
  sequenceStart: 1,
  sequencePad: 2,
  sequenceSeparator: "_",
  sequenceBase: "file",
  sequenceKeepStem: true,
  templateEnabled: false,
  template: "{name}",
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const escapeForCharClass = (value: string) =>
  value.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");

const canCheckSameEntry = (
  handle: FileSystemDirectoryHandle
): handle is FileSystemDirectoryHandle & {
  isSameEntry: (other: FileSystemHandle) => Promise<boolean>;
} => typeof (handle as { isSameEntry?: unknown }).isSameEntry === "function";

const splitName = (name: string) => {
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) return { stem: name, extension: "" };
  return {
    stem: name.slice(0, lastDot),
    extension: name.slice(lastDot + 1),
  };
};

const toCamelCase = (text: string) => {
  const words = text
    .replace(/[_-]+/g, " ")
    .replace(/[^\w\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return text;
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
};

const applyCase = (name: string, mode: RenameCaseMode) => {
  if (mode === "lower") return name.toLowerCase();
  if (mode === "upper") return name.toUpperCase();
  if (mode === "camel") return toCamelCase(name);
  return name;
};

const buildNewName = (
  originalName: string,
  index: number,
  settings: RenameSettings
) => {
  const { stem, extension } = splitName(originalName);
  let nextStem = stem;

  if (settings.search) {
    try {
      if (settings.useRegex) {
        const pattern = new RegExp(settings.search, settings.regexFlags || "g");
        nextStem = nextStem.replace(pattern, settings.replace);
      } else {
        nextStem = nextStem.split(settings.search).join(settings.replace);
      }
    } catch {
      // Invalid regex => keep original stem.
    }
  }

  nextStem = `${settings.prefix}${nextStem}${settings.suffix}`;
  nextStem = applyCase(nextStem, settings.caseMode);

  if (settings.enableSequence) {
    const number = String(settings.sequenceStart + index).padStart(
      settings.sequencePad,
      "0"
    );
    const sequenceStem = settings.sequenceKeepStem
      ? `${nextStem}${settings.sequenceSeparator}${number}`
      : `${settings.sequenceBase}${settings.sequenceSeparator}${number}`;
    nextStem = sequenceStem;
  }

  if (settings.templateEnabled && settings.template.trim()) {
    const indexedNumber = String(settings.sequenceStart + index).padStart(
      settings.sequencePad,
      "0"
    );
    const rendered = settings.template
      .replaceAll("{name}", nextStem)
      .replaceAll("{original}", stem)
      .replaceAll("{ext}", extension)
      .replaceAll("{index}", indexedNumber);
    nextStem = rendered;
  }

  return extension ? `${nextStem}.${extension}` : nextStem;
};

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("alpha");
  const [sortPrefix, setSortPrefix] = useState("");
  const [sortSuffix, setSortSuffix] = useState("");
  const [selectedDirectories, setSelectedDirectories] = useState<
    SelectedDirectory[]
  >([]);
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<Set<string>>(
    new Set()
  );
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applyScope, setApplyScope] = useState<ApplyScope>("all");
  const [filterText, setFilterText] = useState("");
  const [filterExt, setFilterExt] = useState("");
  const [prefixSeparators, setPrefixSeparators] = useState("-_.");
  const [settings, setSettings] = useState<RenameSettings>(defaultSettings);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");
  const [lastOperations, setLastOperations] = useState<RenameOperation[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unsupported = typeof window.showDirectoryPicker !== "function";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Preset[];
      if (Array.isArray(parsed)) {
        setPresets(parsed);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, [presets]);

  const sortedFiles = useMemo(() => {
    const items = [...files];
    if (sortMode === "alpha") {
      items.sort((a, b) => a.name.localeCompare(b.name));
      return items;
    }
    if (sortMode === "extension") {
      items.sort((a, b) => {
        const extA = splitName(a.name).extension;
        const extB = splitName(b.name).extension;
        return extA.localeCompare(extB) || a.name.localeCompare(b.name);
      });
      return items;
    }

    if (sortMode === "prefixMatch") {
      const prefix = sortPrefix.toLowerCase();
      items.sort((a, b) => {
        const aMatch = prefix ? a.name.toLowerCase().startsWith(prefix) : false;
        const bMatch = prefix ? b.name.toLowerCase().startsWith(prefix) : false;
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      return items;
    }

    const suffix = sortSuffix.toLowerCase();
    items.sort((a, b) => {
      const aMatch = suffix ? a.name.toLowerCase().endsWith(suffix) : false;
      const bMatch = suffix ? b.name.toLowerCase().endsWith(suffix) : false;
      if (aMatch !== bMatch) return aMatch ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    return items;
  }, [files, sortMode, sortPrefix, sortSuffix]);

  const filteredFiles = useMemo(() => {
    const text = filterText.trim().toLowerCase();
    const ext = filterExt.trim().toLowerCase().replace(".", "");
    return sortedFiles.filter((file) => {
      const matchesText = text ? file.name.toLowerCase().includes(text) : true;
      const fileExt = splitName(file.name).extension.toLowerCase();
      const matchesExt = ext ? fileExt === ext : true;
      return matchesText && matchesExt;
    });
  }, [sortedFiles, filterText, filterExt]);

  const activeFiles = filteredFiles;

  const previewItems = useMemo<PreviewItem[]>(() => {
    return activeFiles.map((file, index) => {
      const nextName = buildNewName(file.name, index, settings);
      const isSelected = selected.has(file.name);
      const willApply = applyScope === "all" || isSelected;
      return {
        file,
        extension: splitName(file.name).extension || "—",
        newName: nextName,
        changed: nextName !== file.name,
        selected: isSelected,
        willApply,
      };
    });
  }, [settings, activeFiles, selected, applyScope]);

  const commitCandidates = previewItems.filter(
    (item) => item.changed && item.willApply
  );
  const changedCount = commitCandidates.length;

  const toggleSelect = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const setAllFilteredSelected = (value: boolean) => {
    const names = filteredFiles.map((file) => file.name);
    setSelected((prev) => {
      const next = new Set(prev);
      names.forEach((name) => {
        if (value) {
          next.add(name);
        } else {
          next.delete(name);
        }
      });
      return next;
    });
  };

  const readFilesFromDirectory = async (handle: FileSystemDirectoryHandle) => {
    const nextFiles: FileRecord[] = [];
    if (!handle.entries) {
      setError("Trình duyệt chưa hỗ trợ duyệt file trong thư mục đã chọn.");
      return null;
    }
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind !== "file") continue;
      const fileHandle = entry as FileSystemFileHandle;
      const file = await fileHandle.getFile();
      nextFiles.push({
        handle: fileHandle,
        name,
        size: file.size,
      });
    }
    return nextFiles;
  };

  const isDuplicateDirectory = async (candidate: FileSystemDirectoryHandle) => {
    for (const item of selectedDirectories) {
      if (canCheckSameEntry(item.handle)) {
        const same = await item.handle.isSameEntry(candidate);
        if (same) return true;
      } else if (item.name === candidate.name) {
        // Fallback cho trình duyệt chưa hỗ trợ isSameEntry.
        return true;
      }
    }
    return false;
  };

  const loadCurrentDirectoryFiles = async (
    handle: FileSystemDirectoryHandle,
    showMessage = false
  ) => {
    const nextFiles = await readFilesFromDirectory(handle);
    if (!nextFiles) return false;
    setFiles(nextFiles);
    setSelected(new Set());
    if (showMessage) {
      setMessage(`Đã tải ${nextFiles.length} tệp trong thư mục "${handle.name}".`);
    }
    return true;
  };

  const pickDirectory = async (mode: "replace" | "append" = "replace") => {
    if (unsupported) return;
    if (
      mode === "append" &&
      selectedDirectories.length >= MAX_SELECTED_DIRECTORIES
    ) {
      setError(`Chỉ được chọn tối đa ${MAX_SELECTED_DIRECTORIES} thư mục mỗi lần.`);
      return;
    }

    setError(null);
    setMessage(null);
    try {
      const handle = await window.showDirectoryPicker!();
      const permission = handle.requestPermission
        ? await handle.requestPermission({ mode: "readwrite" })
        : "granted";
      if (permission !== "granted") {
        setError("Bạn chưa cấp quyền đọc/ghi thư mục.");
        return;
      }

      const duplicateDirectory =
        mode === "append" ? await isDuplicateDirectory(handle) : false;
      if (mode === "append" && duplicateDirectory) {
        setError(`Thư mục "${handle.name}" đã có trong danh sách.`);
        return;
      }

      const directoryItem: SelectedDirectory = {
        id: crypto.randomUUID(),
        name: handle.name,
        handle,
      };
      const nextDirectories =
        mode === "replace" ? [directoryItem] : [...selectedDirectories, directoryItem];
      setSelectedDirectories(nextDirectories);
      setSelectedDirectoryIds((prev) => {
        if (mode === "replace") return new Set([directoryItem.id]);
        const next = new Set(prev);
        next.add(directoryItem.id);
        return next;
      });
      setDirectoryHandle(handle);
      await loadCurrentDirectoryFiles(handle, true);
    } catch (pickError) {
      if ((pickError as Error).name === "AbortError") return;
      setError("Không thể mở thư mục. Vui lòng thử lại.");
    }
  };

  const switchActiveDirectory = async (directoryId: string) => {
    const target = selectedDirectories.find((item) => item.id === directoryId);
    if (!target) return;
    setError(null);
    setMessage(null);
    setDirectoryHandle(target.handle);
    await loadCurrentDirectoryFiles(target.handle, true);
  };

  const removeDirectory = async (directoryId: string) => {
    const nextDirectories = selectedDirectories.filter(
      (item) => item.id !== directoryId
    );
    setSelectedDirectories(nextDirectories);
    setSelectedDirectoryIds((prev) => {
      const next = new Set(prev);
      next.delete(directoryId);
      return next;
    });
    if (nextDirectories.length === 0) {
      setDirectoryHandle(null);
      setFiles([]);
      setSelected(new Set());
      setMessage("Đã xóa toàn bộ thư mục khỏi danh sách.");
      return;
    }

    const currentStillExists = nextDirectories.some(
      (item) => item.handle === directoryHandle
    );
    if (!currentStillExists) {
      const nextActive = nextDirectories[0];
      setDirectoryHandle(nextActive.handle);
      await loadCurrentDirectoryFiles(nextActive.handle, true);
    }
  };

  const toggleDirectorySelection = (directoryId: string) => {
    setSelectedDirectoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(directoryId)) {
        next.delete(directoryId);
      } else {
        next.add(directoryId);
      }
      return next;
    });
  };

  const setAllDirectoriesSelected = (value: boolean) => {
    if (value) {
      setSelectedDirectoryIds(new Set(selectedDirectories.map((item) => item.id)));
      return;
    }
    setSelectedDirectoryIds(new Set());
  };

  const renameFileByName = async (
    handle: FileSystemDirectoryHandle,
    sourceName: string,
    targetName: string
  ) => {
    if (sourceName === targetName) return;
    const sourceHandle = await handle.getFileHandle(sourceName);
    if (typeof sourceHandle.move === "function") {
      await sourceHandle.move(targetName);
      return;
    }
    const sourceFile = await sourceHandle.getFile();
    const targetHandle = await handle.getFileHandle(targetName, {
      create: true,
    });
    const writable = await targetHandle.createWritable();
    await writable.write(await sourceFile.arrayBuffer());
    await writable.close();
    await handle.removeEntry(sourceName);
  };

  const extractPrefixBySeparators = (fileName: string, separators: string) => {
    const { stem } = splitName(fileName);
    const chars = separators.trim();
    if (!chars) return "";
    const classParts = chars
      .split("")
      .map((char) => escapeForCharClass(char))
      .join("");
    if (!classParts) return "";
    const segments = stem
      .split(new RegExp(`[${classParts}]+`))
      .map((segment) => segment.trim())
      .filter(Boolean);
    return segments[0] ?? "";
  };

  const moveFileToSubFolder = async (
    handle: FileSystemDirectoryHandle,
    sourceName: string,
    subFolderName: string
  ): Promise<MoveToSubFolderResult> => {
    const targetDir = await handle.getDirectoryHandle(subFolderName, {
      create: true,
    });

    try {
      await targetDir.getFileHandle(sourceName);
      return { moved: false, reason: "exists" };
    } catch {
      // File chưa tồn tại trong thư mục đích.
    }

    const sourceHandle = await handle.getFileHandle(sourceName);
    const sourceFile = await sourceHandle.getFile();
    const targetHandle = await targetDir.getFileHandle(sourceName, {
      create: true,
    });
    const writable = await targetHandle.createWritable();
    await writable.write(await sourceFile.arrayBuffer());
    await writable.close();
    await handle.removeEntry(sourceName);
    return { moved: true, reason: null };
  };

  const validateConflicts = (items: PreviewItem[]) => {
    const duplicates = new Set<string>();
    const seen = new Set<string>();
    const unchangedNames = new Set(
      files
        .map((file) => file.name)
        .filter((name) => !items.some((item) => item.file.name === name))
    );

    for (const item of items) {
      if (seen.has(item.newName)) duplicates.add(item.newName);
      seen.add(item.newName);
      if (unchangedNames.has(item.newName)) duplicates.add(item.newName);
    }

    return duplicates;
  };

  const commitChanges = async () => {
    if (!directoryHandle || changedCount === 0) return;

    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const duplicates = validateConflicts(commitCandidates);

      if (duplicates.size > 0) {
        setError(
          `Có xung đột tên file: ${Array.from(duplicates).slice(0, 3).join(", ")}`
        );
        setBusy(false);
        return;
      }

      const operations: RenameOperation[] = [];
      for (const item of commitCandidates) {
        await renameFileByName(directoryHandle, item.file.name, item.newName);
        operations.push({ from: item.file.name, to: item.newName });
      }

      setLastOperations(operations);
      await loadCurrentDirectoryFiles(directoryHandle);
      setMessage(`Đổi tên thành công ${operations.length} file.`);
    } catch {
      setError(
        "Không thể áp dụng thay đổi. Trình duyệt có thể chưa hỗ trợ đầy đủ đổi tên file."
      );
    } finally {
      setBusy(false);
    }
  };

  const undoLastCommit = async () => {
    if (!directoryHandle || lastOperations.length === 0) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      for (const operation of [...lastOperations].reverse()) {
        await renameFileByName(directoryHandle, operation.to, operation.from);
      }
      const undoCount = lastOperations.length;
      setLastOperations([]);
      await loadCurrentDirectoryFiles(directoryHandle);
      setMessage(`Đã hoàn tác ${undoCount} thay đổi gần nhất.`);
    } catch {
      setError("Không thể hoàn tác. Hãy kiểm tra lại trạng thái file hiện tại.");
    } finally {
      setBusy(false);
    }
  };

  const organizeIntoSubFoldersByPrefix = async () => {
    const checkedDirectories = selectedDirectories.filter((item) =>
      selectedDirectoryIds.has(item.id)
    );
    const targetDirectories =
      checkedDirectories.length > 0
        ? checkedDirectories
        : selectedDirectories.length > 0
          ? []
          : directoryHandle
            ? [
                {
                  id: "single",
                  name: directoryHandle.name,
                  handle: directoryHandle,
                },
              ]
            : [];

    if (targetDirectories.length === 0) {
      setError("Vui lòng tick ít nhất một thư mục để thực hiện.");
      return;
    }
    if (!prefixSeparators.trim()) {
      setError("Vui lòng nhập ít nhất một ký tự phân tách tiền tố.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      let movedCount = 0;
      let noPrefixCount = 0;
      let existsCount = 0;
      let failedCount = 0;
      let processedFolderCount = 0;

      for (const targetDirectory of targetDirectories) {
        const sourceNames =
          selectedDirectories.length === 0
            ? previewItems
                .filter((item) => item.willApply)
                .map((item) => item.file.name)
            : (await readFilesFromDirectory(targetDirectory.handle))?.map(
                (file) => file.name
              ) ?? [];
        if (sourceNames.length === 0) {
          continue;
        }
        processedFolderCount += 1;

        for (const sourceName of sourceNames) {
          const prefix = extractPrefixBySeparators(sourceName, prefixSeparators);
          if (!prefix) {
            noPrefixCount += 1;
            continue;
          }
          try {
            const result = await moveFileToSubFolder(
              targetDirectory.handle,
              sourceName,
              prefix
            );
            if (result.moved) {
              movedCount += 1;
            } else {
              existsCount += 1;
            }
          } catch {
            failedCount += 1;
          }
        }
      }

      setLastOperations([]);
      if (directoryHandle) {
        await loadCurrentDirectoryFiles(directoryHandle);
      }
      setMessage(
        `Phân loại xong ${processedFolderCount} thư mục: đã di chuyển ${movedCount} tệp, không có tiền tố ${noPrefixCount}, trùng tên ${existsCount}, lỗi ${failedCount}.`
      );
    } catch {
      setError("Không thể tạo thư mục con theo tiền tố. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const savePreset = () => {
    const name = presetName.trim();
    if (!name) {
      setError("Nhập tên mẫu cấu hình trước khi lưu.");
      return;
    }
    const preset: Preset = {
      id: crypto.randomUUID(),
      name,
      settings,
    };
    setPresets((prev) => [preset, ...prev]);
    setPresetName("");
    setMessage(`Đã lưu mẫu cấu hình "${name}".`);
  };

  const loadPreset = (preset: Preset) => {
    setSettings(preset.settings);
    setMessage(`Đã áp dụng mẫu cấu hình "${preset.name}".`);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((preset) => preset.id !== id));
  };

  const allFilteredSelected =
    filteredFiles.length > 0 &&
    filteredFiles.every((file) => selected.has(file.name));
  const selectedInListCount = previewItems.filter((item) => item.selected).length;
  const selectedDirectoryCount = selectedDirectories.filter((item) =>
    selectedDirectoryIds.has(item.id)
  ).length;
  const allDirectoriesSelected =
    selectedDirectories.length > 0 &&
    selectedDirectories.every((item) => selectedDirectoryIds.has(item.id));

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 p-4 lg:flex-row">
          <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:w-[360px]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                <Edit className="h-4 w-4" />
                Công cụ đổi tên
              </div>
              <button
                type="button"
                onClick={() => setDarkMode((prev) => !prev)}
                className="rounded-lg border border-slate-300 p-2 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => pickDirectory("replace")}
                disabled={unsupported || busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Folder className="h-4 w-4" />
                Chọn lại
              </button>
              <button
                type="button"
                onClick={() => pickDirectory("append")}
                disabled={
                  unsupported ||
                  busy ||
                  selectedDirectories.length >= MAX_SELECTED_DIRECTORIES
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <Folder className="h-4 w-4" />
                Thêm thư mục
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Danh sách thư mục ({selectedDirectories.length}/{MAX_SELECTED_DIRECTORIES})
              </p>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  Đã tick {selectedDirectoryCount}/{selectedDirectories.length} thư mục
                </p>
                <button
                  type="button"
                  onClick={() => setAllDirectoriesSelected(!allDirectoriesSelected)}
                  disabled={selectedDirectories.length === 0}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {allDirectoriesSelected ? "Bỏ tick tất cả" : "Tick tất cả"}
                </button>
              </div>
              <div className="max-h-28 space-y-1 overflow-auto">
                {selectedDirectories.map((item) => {
                  const isActive = item.handle === directoryHandle;
                  const isChecked = selectedDirectoryIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between rounded-md border px-2 py-1 ${
                        isActive
                          ? "border-blue-500/60 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <label className="mr-2 flex items-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDirectorySelection(item.id)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => switchActiveDirectory(item.id)}
                        className="flex-1 truncate text-left text-xs hover:underline"
                        title={item.name}
                      >
                        {item.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDirectory(item.id)}
                        className="text-xs text-rose-500"
                      >
                        Xóa
                      </button>
                    </div>
                  );
                })}
                {selectedDirectories.length === 0 && (
                  <p className="text-xs text-slate-500">Chưa có thư mục nào.</p>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Có thể chọn tối đa {MAX_SELECTED_DIRECTORIES} thư mục trong một lần thao tác.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phạm vi và bộ lọc
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={filterText}
                    onChange={(event) => setFilterText(event.target.value)}
                    placeholder="Lọc theo tên tệp"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <input
                    value={filterExt}
                    onChange={(event) => setFilterExt(event.target.value)}
                    placeholder="Lọc đuôi tệp (vd: png)"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={applyScope}
                    onChange={(event) =>
                      setApplyScope(event.target.value as ApplyScope)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <option value="all">Áp dụng cho tệp đang lọc</option>
                    <option value="selected">Chỉ áp dụng cho tệp đã chọn</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setAllFilteredSelected(!allFilteredSelected)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700"
                  >
                    {allFilteredSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                </div>
                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <p className="mb-1 text-xs font-semibold text-slate-500">
                    Tạo thư mục con theo tiền tố
                  </p>
                  <input
                    value={prefixSeparators}
                    onChange={(event) => setPrefixSeparators(event.target.value)}
                    placeholder="Ký tự phân tách (vd: -_.)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ví dụ: `Cao Phuong Nam_abc.pdf` sẽ vào thư mục `Cao Phuong Nam`.
                  </p>
                  <button
                    type="button"
                    onClick={organizeIntoSubFoldersByPrefix}
                    disabled={!directoryHandle || busy}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    Tạo thư mục và di chuyển theo tiền tố
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mẫu cấu hình
                </p>
                <div className="flex gap-2">
                  <input
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                    placeholder="Tên mẫu cấu hình"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={savePreset}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white dark:bg-slate-200 dark:text-slate-900"
                  >
                    Lưu
                  </button>
                </div>
                <div className="mt-2 max-h-28 space-y-1 overflow-auto">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-2 py-1 dark:border-slate-700"
                    >
                      <button
                        type="button"
                        onClick={() => loadPreset(preset)}
                        className="text-left text-xs hover:underline"
                      >
                        {preset.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePreset(preset.id)}
                        className="text-xs text-rose-500"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  {presets.length === 0 && (
                    <p className="text-xs text-slate-500">Chưa có mẫu cấu hình.</p>
                  )}
                </div>
              </div>

              <label className="block">
                <span className="mb-1 block text-slate-500">Kiểu sắp xếp</span>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="alpha">Theo bảng chữ cái</option>
                  <option value="extension">Theo phần mở rộng</option>
                  <option value="prefixMatch">Ưu tiên theo tiền tố</option>
                  <option value="suffixMatch">Ưu tiên theo hậu tố</option>
                </select>
              </label>

              {sortMode === "prefixMatch" && (
                <input
                  value={sortPrefix}
                  onChange={(event) => setSortPrefix(event.target.value)}
                  placeholder="Tiền tố để ưu tiên"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
              )}
              {sortMode === "suffixMatch" && (
                <input
                  value={sortSuffix}
                  onChange={(event) => setSortSuffix(event.target.value)}
                  placeholder="Hậu tố để ưu tiên"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={settings.prefix}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, prefix: event.target.value }))
                  }
                  placeholder="Thêm tiền tố"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  value={settings.suffix}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, suffix: event.target.value }))
                  }
                  placeholder="Thêm hậu tố"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  value={settings.search}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, search: event.target.value }))
                  }
                  placeholder="Tìm kiếm"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
                <input
                  value={settings.replace}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, replace: event.target.value }))
                  }
                  placeholder="Thay thế"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.useRegex}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      useRegex: event.target.checked,
                    }))
                  }
                />
                Dùng Regex cho Search & Replace
              </label>

              {settings.useRegex && (
                <input
                  value={settings.regexFlags}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      regexFlags: event.target.value,
                    }))
                  }
                  placeholder="Cờ Regex (vd: gi)"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                />
              )}

              <label className="block">
                <span className="mb-1 block text-slate-500">Kiểu chữ</span>
                <select
                  value={settings.caseMode}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      caseMode: event.target.value as RenameCaseMode,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="keep">Giữ nguyên</option>
                  <option value="lower">chữ thường</option>
                  <option value="upper">CHỮ HOA</option>
                  <option value="camel">kiểu camelCase</option>
                </select>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enableSequence}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      enableSequence: event.target.checked,
                    }))
                  }
                />
                Bật đánh số thứ tự
              </label>

              {settings.enableSequence && (
                <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.sequenceKeepStem}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          sequenceKeepStem: event.target.checked,
                        }))
                      }
                    />
                    Giữ tên gốc + số thứ tự
                  </label>

                  {!settings.sequenceKeepStem && (
                    <input
                      value={settings.sequenceBase}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          sequenceBase: event.target.value,
                        }))
                      }
                      placeholder="Tên gốc mới (vd: tep)"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={settings.sequenceStart}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          sequenceStart: Number(event.target.value || 1),
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      type="number"
                      value={settings.sequencePad}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          sequencePad: Number(event.target.value || 2),
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      value={settings.sequenceSeparator}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          sequenceSeparator: event.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </div>
                </>
              )}

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.templateEnabled}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      templateEnabled: event.target.checked,
                    }))
                  }
                />
                Bật template tên file
              </label>
              {settings.templateEnabled && (
                <div>
                  <input
                    value={settings.template}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        template: event.target.value,
                      }))
                    }
                    placeholder="{name}-{index} | {original} | {ext} | {index}"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Biến hỗ trợ: {"{name}"} {"{original}"} {"{ext}"} {"{index}"}
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">Tiện ích quản lý và đổi tên tệp</h1>
                <p className="text-sm text-slate-500">
                  {directoryHandle
                    ? `Thư mục: ${directoryHandle.name}`
                    : "Chưa chọn thư mục"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={undoLastCommit}
                  disabled={busy || lastOperations.length === 0 || !directoryHandle}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-4 w-4" />
                  Hoàn tác lần gần nhất ({lastOperations.length})
                </button>
                <button
                  type="button"
                  onClick={commitChanges}
                  disabled={busy || changedCount === 0 || !directoryHandle}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  Áp dụng thay đổi ({changedCount})
                </button>
              </div>
            </div>

            {unsupported && (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                Trình duyệt hiện tại chưa hỗ trợ đầy đủ File System Access API. Vui lòng dùng Chrome/Edge bản mới.
              </p>
            )}
            {error && (
              <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200">
                {error}
              </p>
            )}
            {message && (
              <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                {message}
              </p>
            )}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                Đang chọn {selectedInListCount}/{previewItems.length} tệp trong danh sách.
              </p>
              <button
                type="button"
                onClick={() => setAllFilteredSelected(!allFilteredSelected)}
                disabled={previewItems.length === 0}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                {allFilteredSelected ? "Bỏ đánh dấu tất cả" : "Chọn tất cả"}
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="min-w-full table-auto text-sm">
                <thead className="bg-slate-50 text-left text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2">Chọn</th>
                    <th className="px-3 py-2">Tệp</th>
                    <th className="px-3 py-2">Phần mở rộng</th>
                    <th className="px-3 py-2">Dung lượng</th>
                    <th className="px-3 py-2">Tên hiện tại</th>
                    <th className="px-3 py-2">Tên mới (xem trước)</th>
                  </tr>
                </thead>
                <motion.tbody layout>
                  <AnimatePresence>
                    {previewItems.map((item) => (
                      <motion.tr
                        key={item.file.name}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="border-t border-slate-200 dark:border-slate-800"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() => toggleSelect(item.file.name)}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <FileIcon className="h-4 w-4 text-slate-500" />
                        </td>
                        <td className="px-3 py-2">{item.extension}</td>
                        <td className="px-3 py-2">{formatBytes(item.file.size)}</td>
                        <td className="px-3 py-2">{item.file.name}</td>
                        <td
                          className={`px-3 py-2 font-medium ${
                            item.changed && item.willApply
                              ? "text-blue-600 dark:text-blue-400"
                              : item.changed
                                ? "text-amber-500 dark:text-amber-400"
                                : "text-slate-500"
                          }`}
                        >
                          {item.newName}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
