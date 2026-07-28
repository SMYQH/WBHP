export type LanguageMode = "auto" | "zh" | "en";
export type FontFamily = "misans" | "serif" | "opensans" | "system";

export interface Translations {
  settings: {
    title: string;
    close: string;
    tabs: {
      general: string;
      background: string;
      backup: string;
      data: string;
    };
    general: {
      theme: string;
      themeOptions: {
        system: string;
        light: string;
        dark: string;
      };
      language: string;
      languageOptions: {
        auto: string;
        zh: string;
        en: string;
      };
      font: string;
      fontOptions: {
        misans: string;
        serif: string;
        opensans: string;
        system: string;
      };
      userName: string;
      userNamePlaceholder: string;
      activeWidgets: string;
      activeWidgetsHelp: string;
    };
    background: {
      title: string;
      color: string;
      gradient: string;
      custom: string;
      preset: string;
      customUrl: string;
      customUpload: string;
      customUploadBtn: string;
      blur: string;
      overlay: string;
      presetStyle: string;
    };
    backup: {
      enableWebdav: string;
      urlPlaceholder: string;
      usernamePlaceholder: string;
      passwordPlaceholder: string;
      autoInterval: string;
      testBtn: string;
      backupBtn: string;
      restoreBtn: string;
      testing: string;
      connected: string;
      failed: string;
      backingUp: string;
      restoring: string;
      backupSuccess: string;
      backupFailed: string;
      restoreSuccess: string;
      restoreFailed: string;
      restoreConfirm: string;
      noBackup: string;
      corrupted: string;
      notice: string;
    };
    data: {
      exportBtn: string;
      importBtn: string;
      clearBtn: string;
      exported: string;
      imported: string;
      cleared: string;
      invalid: string;
      clearConfirm: string;
    };
  };
  widgets: {
    time: {
      name: string;
      desc: string;
      showSeconds: string;
      showDate: string;
      hour12: string;
    };
    greeting: {
      name: string;
      desc: string;
      night: string;
      morning: string;
      afternoon: string;
      evening: string;
    };
    search: {
      name: string;
      desc: string;
      placeholder: string;
      button: string;
    };
    links: {
      name: string;
      desc: string;
      addBtn: string;
      titlePlaceholder: string;
      urlPlaceholder: string;
      saveBtn: string;
      cancelBtn: string;
      titleRequired: string;
      urlInvalid: string;
      remove: string;
    };
    weather: {
      name: string;
      desc: string;
      locationPlaceholder: string;
      offlineNotice: string;
      unitCelsius: string;
      unitFahrenheit: string;
      city: string;
      temp: string;
      condition: string;
    };
  };
  backgrounds: {
    color: { name: string; desc: string };
    gradient: { name: string; desc: string };
    custom: { name: string; desc: string };
    preset: { name: string; desc: string };
  };
}

export const zhTranslations: Translations = {
  settings: {
    title: "设置",
    close: "关闭设置",
    tabs: {
      general: "常规",
      background: "背景外观",
      backup: "云端备份",
      data: "数据管理",
    },
    general: {
      theme: "外观主题",
      themeOptions: {
        system: "跟随系统",
        light: "浅色模式",
        dark: "深色模式",
      },
      language: "界面语言",
      languageOptions: {
        auto: "自动检测",
        zh: "简体中文",
        en: "English",
      },
      font: "界面字体",
      fontOptions: {
        misans: "小米字体 (MiSans)",
        serif: "思源宋体 (Serif)",
        opensans: "Open Sans (极客)",
        system: "无障碍系统默认",
      },
      userName: "您的称呼",
      userNamePlaceholder: "请输入您的名字...",
      activeWidgets: "启用挂件",
      activeWidgetsHelp: "未选择任何挂件时默认全选。点击挂件卡片可自由切换显示/隐藏。",
    },
    background: {
      title: "背景模式",
      color: "纯色背景",
      gradient: "渐变色背景",
      custom: "自定义图片/本地上传",
      preset: "内置离线矢量图案",
      customUrl: "自定义壁纸 URL 链接",
      customUpload: "本地图片上传",
      customUploadBtn: "选择本地图片",
      blur: "高斯模糊",
      overlay: "暗化遮罩",
      presetStyle: "图案风格",
    },
    backup: {
      enableWebdav: "启用 WebDAV 云备份",
      urlPlaceholder: "WebDAV URL (如 https://dav.example.com/files/)",
      usernamePlaceholder: "用户名",
      passwordPlaceholder: "密码 / 应用授权码",
      autoInterval: "自动备份间隔（分钟，0 表示关闭）",
      testBtn: "测试连接",
      backupBtn: "立即备份",
      restoreBtn: "恢复备份",
      testing: "正在测试连接...",
      connected: "✓ WebDAV 连接成功",
      failed: "✗ 连接失败，请检查配置",
      backingUp: "正在上传备份...",
      restoring: "正在从云端恢复...",
      backupSuccess: "备份已成功保存至 WebDAV 服务器",
      backupFailed: "备份保存失败",
      restoreSuccess: "数据已成功恢复",
      restoreFailed: "恢复数据失败",
      restoreConfirm: "确定要从云端恢复数据吗？这将覆盖当前本地配置。",
      noBackup: "服务器上未找到备份文件",
      corrupted: "备份文件损坏或格式不正确",
      notice: "所有凭据安全存储在本地浏览器配置文件中，建议使用应用专用独立密码/Token。",
    },
    data: {
      exportBtn: "导出数据配置 (JSON)",
      importBtn: "导入数据配置 (JSON)",
      clearBtn: "清空所有本地数据",
      exported: "配置数据已成功导出为 JSON 文件。",
      imported: "配置数据导入成功，正在刷新页面...",
      cleared: "所有本地数据已清空，正在重置...",
      invalid: "无效的备份 JSON 文件。",
      clearConfirm: "警告：确定要清空 WBHP 的所有本地配置与数据吗？此操作不可逆！",
    },
  },
  widgets: {
    time: {
      name: "精美时钟",
      desc: "高清数字时钟与日期显示",
      showSeconds: "显示秒数",
      showDate: "显示日期",
      hour12: "12小时制",
    },
    greeting: {
      name: "问候语",
      desc: "根据时间动态变化的人性化问候",
      night: "夜深了，注意休息",
      morning: "早上好",
      afternoon: "下午好",
      evening: "晚上好",
    },
    search: {
      name: "快捷搜索",
      desc: "多引擎无缝切换的网页搜索栏",
      placeholder: "输入关键词搜索...",
      button: "搜索",
    },
    links: {
      name: "快捷导航",
      desc: "一键直达常用网站与书签",
      addBtn: "添加导航",
      titlePlaceholder: "网站名称",
      urlPlaceholder: "https://example.com",
      saveBtn: "保存",
      cancelBtn: "取消",
      titleRequired: "请输入网站名称",
      urlInvalid: "请输入有效的 http(s) 网址",
      remove: "删除此导航",
    },
    weather: {
      name: "天气面板",
      desc: "离线优化的简洁天气预报",
      locationPlaceholder: "城市名称",
      offlineNotice: "100% 离线隐私保护",
      unitCelsius: "摄氏度 (°C)",
      unitFahrenheit: "华氏度 (°F)",
      city: "城市",
      temp: "温度",
      condition: "天气状况",
    },
  },
  backgrounds: {
    color: { name: "纯色背景", desc: "简约干净的单色背景" },
    gradient: { name: "炫彩渐变", desc: "柔和优雅的平滑渐变色彩" },
    custom: { name: "自定义壁纸", desc: "支持上传本地图片或自定义图像 URL" },
    preset: { name: "艺术图腾", desc: "无需网络的高清纯离线矢量绘表" },
  },
};

export const enTranslations: Translations = {
  settings: {
    title: "Settings",
    close: "Close Settings",
    tabs: {
      general: "General",
      background: "Background",
      backup: "Cloud Sync",
      data: "Data",
    },
    general: {
      theme: "Theme Mode",
      themeOptions: {
        system: "System",
        light: "Light",
        dark: "Dark",
      },
      language: "Language",
      languageOptions: {
        auto: "Auto Detect",
        zh: "Chinese",
        en: "English",
      },
      font: "Typography Font",
      fontOptions: {
        misans: "MiSans (Xiaomi)",
        serif: "Source Han Serif",
        opensans: "Open Sans (Monospace/Modern)",
        system: "System Default",
      },
      userName: "Your Name",
      userNamePlaceholder: "Enter your name...",
      activeWidgets: "Active Widgets",
      activeWidgetsHelp: "Selecting none displays all widgets by default. Click to toggle.",
    },
    background: {
      title: "Background Mode",
      color: "Solid Color",
      gradient: "Smooth Gradient",
      custom: "Custom Image / Local Upload",
      preset: "Offline Vector Patterns",
      customUrl: "Custom Image URL",
      customUpload: "Local Image Upload",
      customUploadBtn: "Choose Local Image",
      blur: "Gaussian Blur",
      overlay: "Dark Overlay",
      presetStyle: "Pattern Style",
    },
    backup: {
      enableWebdav: "Enable WebDAV Sync",
      urlPlaceholder: "WebDAV URL (e.g. https://dav.example.com/files/)",
      usernamePlaceholder: "Username",
      passwordPlaceholder: "Password / App Token",
      autoInterval: "Auto-backup interval (minutes, 0 = off)",
      testBtn: "Test Connection",
      backupBtn: "Backup Now",
      restoreBtn: "Restore",
      testing: "Testing connection...",
      connected: "✓ WebDAV Connected successfully",
      failed: "✗ Connection failed, check credentials",
      backingUp: "Uploading backup...",
      restoring: "Restoring from cloud...",
      backupSuccess: "Backup uploaded successfully.",
      backupFailed: "Backup upload failed.",
      restoreSuccess: "Data restored successfully.",
      restoreFailed: "Failed to restore data.",
      restoreConfirm: "Restore will overwrite local data. Proceed?",
      noBackup: "No backup found on server.",
      corrupted: "Backup file is corrupted.",
      notice: "Credentials are stored locally in your browser. App tokens recommended.",
    },
    data: {
      exportBtn: "Export Config (JSON)",
      importBtn: "Import Config (JSON)",
      clearBtn: "Clear All Data",
      exported: "Configuration exported as JSON file.",
      imported: "Import successful. Reloading page...",
      cleared: "All data cleared. Resetting...",
      invalid: "Invalid backup JSON file.",
      clearConfirm: "Warning: Clear all local WBHP data? This action cannot be undone!",
    },
  },
  widgets: {
    time: {
      name: "Clock",
      desc: "Digital clock with date and custom time format",
      showSeconds: "Show seconds",
      showDate: "Show date",
      hour12: "12-hour format",
    },
    greeting: {
      name: "Greeting",
      desc: "Time-aware friendly greeting message",
      night: "Good night",
      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",
    },
    search: {
      name: "Search Bar",
      desc: "Web search bar with multi-engine support",
      placeholder: "Search the web...",
      button: "Search",
    },
    links: {
      name: "Quick Links",
      desc: "Your favorite bookmarks and quick launch shortcuts",
      addBtn: "Add Link",
      titlePlaceholder: "Link Title",
      urlPlaceholder: "https://example.com",
      saveBtn: "Save",
      cancelBtn: "Cancel",
      titleRequired: "Title is required",
      urlInvalid: "Please enter a valid http(s) URL",
      remove: "Remove link",
    },
    weather: {
      name: "Weather",
      desc: "Privacy-focused offline weather widget",
      locationPlaceholder: "City Name",
      offlineNotice: "100% Offline & Private",
      unitCelsius: "Celsius (°C)",
      unitFahrenheit: "Fahrenheit (°F)",
      city: "City",
      temp: "Temperature",
      condition: "Condition",
    },
  },
  backgrounds: {
    color: { name: "Solid Color", desc: "Clean and minimal solid color" },
    gradient: { name: "Gradient", desc: "Smooth color transition" },
    custom: { name: "Custom Wallpaper", desc: "Upload local photo or enter image URL" },
    preset: { name: "Offline Patterns", desc: "High quality vector geometric backdrops" },
  },
};
