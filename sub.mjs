import { execSync } from "node:child_process";
import {
  existsSync,
  rmSync,
  writeFileSync,
  lstatSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import path from "path";
import {
  WHISPER_LANG,
  WHISPER_MODEL,
  WHISPER_PATH,
  WHISPER_VERSION,
} from "./whisper-config.mjs";
import {
  downloadWhisperModel,
  installWhisperCpp,
  transcribe,
  toCaptions,
} from "@remotion/install-whisper-cpp";

const extractToTempAudioFile = (fileToTranscribe, tempOutFile) => {
  // Extracting audio from mp4 and save it as 16khz wav file
  execSync(
    `npx remotion ffmpeg -i "${fileToTranscribe}" -ar 16000 "${tempOutFile}" -y`,
    { stdio: ["ignore", "inherit"] },
  );
};

const subFile = async (filePath, fileName, folder) => {
  const outPath = path.join(
    process.cwd(),
    "public",
    "subs",
    fileName.replace(".wav", ".json"),
  );

  const whisperCppOutput = await transcribe({
    inputPath: filePath,
    model: WHISPER_MODEL,
    tokenLevelTimestamps: true,
    whisperPath: WHISPER_PATH,
    printOutput: false,
    translateToEnglish: false,
    language: WHISPER_LANG,
    splitOnWord: true,
  });

  const { captions } = toCaptions({
    whisperCppOutput,
  });
  writeFileSync(outPath, JSON.stringify(captions, null, 2));
  return outPath;
};

const processVideo = async (fullPath, entry, directory) => {
  if (
    !fullPath.endsWith(".mp4") &&
    !fullPath.endsWith(".webm") &&
    !fullPath.endsWith(".mkv") &&
    !fullPath.endsWith(".mov") &&
    !fullPath.endsWith(".wav")
  ) {
    return;
  }

  const isTranscribed = existsSync(
    fullPath
      .replace(/.mp4$/, ".json")
      .replace(/.mkv$/, ".json")
      .replace(/.mov$/, ".json")
      .replace(/.webm$/, ".json")
      .replace(/.wav$/, ".json")
      .replace("uploads", "subs")
  );
  
  if (isTranscribed) {
    return;
  }

  if (fullPath.endsWith(".wav")) {
    // If it's already a WAV file, process it directly
    return await subFile(
      fullPath,
      path.basename(fullPath),
      "subs"
    );
  }

  // For video files, extract audio first
  const tempWavFileName = path.basename(entry).split(".")[0] + ".wav";
  const tempOutFilePath = path.join(process.cwd(), "temp", tempWavFileName);

  console.log("Extracting audio from file", entry);
  extractToTempAudioFile(fullPath, tempOutFilePath);
  
  const outPath = await subFile(
    tempOutFilePath,
    tempWavFileName,
    "subs"
  );

  // Clean up temp WAV file
  if (existsSync(tempOutFilePath)) {
    rmSync(tempOutFilePath);
  }

  return outPath;
};

const processDirectory = async (directory) => {
  const entries = readdirSync(directory).filter((f) => f !== ".DS_Store");

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stat = lstatSync(fullPath);

    if (stat.isDirectory()) {
      await processDirectory(fullPath);
    } else {
      await processVideo(fullPath, entry, directory);
    }
  }
};

// Install whisper if needed
if (!existsSync(WHISPER_PATH)) {
  await installWhisperCpp({ to: WHISPER_PATH, version: WHISPER_VERSION });
  await downloadWhisperModel({ folder: WHISPER_PATH, model: WHISPER_MODEL });
}

// Read arguments for filename if given else process all files in the directory
const hasArgs = process.argv.length > 2;

if (!hasArgs) {
  await processDirectory(path.join(process.cwd(), "public", "uploads"));
  process.exit(0);
}

for (const arg of process.argv.slice(2)) {
  const fullPath = arg;
  if (!existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    continue;
  }

  console.log(`Processing file ${fullPath}`);
  const directory = path.dirname(fullPath);
  const fileName = path.basename(fullPath);
  await processVideo(fullPath, fileName, directory);
}
