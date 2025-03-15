import fs from 'fs';

export function findJSFiles(dirPath: string): string[] {
  const direntFiles = fs.readdirSync(dirPath, { withFileTypes: true, recursive: true });
  const files = direntFiles
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.path+'/'+dirent.name);
  // console.log(files)
  const filteredFiles = files.filter(file => file.endsWith('.js') && !file.endsWith('.map.js'));
  // console.log(filteredFiles);
  return filteredFiles;
}

export function delay(timeInMilliseconds: number): Promise<void> {
  if (typeof timeInMilliseconds !== 'number') throw new TypeError('`time_in_milliseconds` must be a number');

  return new Promise((resolve) => setTimeout(() => resolve(), timeInMilliseconds));
}