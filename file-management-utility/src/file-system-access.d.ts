declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemDirectoryHandle {
    requestPermission?: (descriptor?: {
      mode?: "read" | "readwrite";
    }) => Promise<PermissionState>;
    entries?: () => AsyncIterableIterator<[string, FileSystemHandle]>;
  }

  interface FileSystemFileHandle {
    move?: (name: string) => Promise<void>;
  }
}

export {};
