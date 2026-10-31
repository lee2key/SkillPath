# SkillPath — офлайн-курсы

Два отдельных веб-приложения: редактор курса для автора и автономный плеер для учеников. Контент, изображения, GIF и MP4 остаются на компьютере.

## Редактор (ваш компьютер)

Нужен Node.js. В Windows запустите `start-admin.bat` двойным щелчком в папке проекта. Откроется редактор на `http://127.0.0.1:3210`. Оставляйте окно запуска открытым, пока работаете в админке. Также можно запустить редактор командой `npm run admin`.

В нём можно создавать курсы и уроки, добавлять теорию, вопросы с выбором, текстовые ответы, медиафайлы и менять порядок уроков/блоков. Каталог курсов сохраняется в `content/courses.json`, а медиа — в `content/assets`.

В каталоге есть курс «Marvelous Designer — с нуля»: 20 уроков по 6 экранов. В каждом уроке есть теория, небольшое практическое действие в Marvelous Designer и вопросы для закрепления. Медиафайлы этому курсу не требуются.

Материал составлен по официальной справке Marvelous Designer: [Quick Start](https://support.marvelousdesigner.com/hc/en-us/sections/47114858062233-Quick-Start), [создание лекал](https://support.marvelousdesigner.com/hc/en-us/sections/51986608298009-2D-Pattern-Shape), [расположение деталей](https://support.marvelousdesigner.com/hc/en-us/articles/47358262924185-Arrange-Pattern-with-Arrangement-Points-Flip-Wrap-Direction), [Segment Sewing](https://support.marvelousdesigner.com/hc/en-us/articles/47358199517209-Segment-Sewing-2D), [Simulation](https://support.marvelousdesigner.com/hc/en-us/articles/47358232630937-Simulation), [свойства ткани](https://support.marvelousdesigner.com/hc/en-us/articles/47358440962713-FABRIC-PHYSICAL-PROPERTIES-Physical-Property-Preset), [Particle Distance](https://support.marvelousdesigner.com/hc/en-us/articles/47358268602777-Particle-Distance-Setting), [сохранение проекта](https://support.marvelousdesigner.com/hc/en-us/articles/47358219651225-Project-File-ZPrj-Open-Save) и [экспорт OBJ](https://support.marvelousdesigner.com/hc/en-us/articles/47358223288601-3D-File-OBJ-Import-Export). Названия отдельных команд могут различаться по версии программы.

## Поставка ученику

Кнопка «Проверить файлы» в админке показывает неиспользуемые ресурсы и отсутствующие файлы для всех курсов редактора и отдельно для текущего релиза. Перед проверкой сохраните изменения, если удаляли медиа из уроков. Несохранённые добавления защищены от очистки.

Кнопка «Очистить неиспользуемые» перемещает найденные файлы в `_resource-trash/<дата>/source` и `release` рядом с проектом. Для восстановления верните файл с тем же относительным путём в `content/assets` или `release/content/assets`. Резервная папка не включается в поставку ученику. Если старый релиз ещё использует удалённое из редактора медиа, файл остаётся защищённым до следующей сборки.

Сборка копирует только ресурсы, используемые сохранёнными курсами, проверяет отсутствующие файлы и переносит лишние ресурсы старого релиза в резервную папку. Уже существующие `release/data` и автономный исполняемый файл сохраняются.

1. Выполните `npm run release`.
2. Для Windows выполните `npm run package:win`; для Mac — `npm run package:mac`.
3. Передайте папку `release` целиком. Ученик запускает `start-windows.bat` либо `start-mac.command`.

После сборки в папке появляется переносимый `SkillPath.exe` или `SkillPath`, поэтому Node.js у ученика не нужен. Его данные хранятся рядом, в `release/data/progress.json`.

Примечание: macOS может потребовать разрешить запуск неподписанного локального приложения через настройки безопасности. Сборку для Mac лучше выполнять на Mac.
