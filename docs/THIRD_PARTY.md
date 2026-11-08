# Third-party material

## Microsoft Fluent Emoji (flat style)

The pictures of things (food, toys, music, books, plants, party) come from Microsoft's Fluent Emoji, flat style, via the `@iconify-json/fluent-emoji-flat` package. Only the pictures the game uses are copied into `src/design/thingArt.ts` by `npm run art` (`scripts/make-thing-art.ts`); nothing is fetched at run time. The grown-up area credits them.

Source: https://github.com/microsoft/fluentui-emoji

```
    MIT License

    Copyright (c) Microsoft Corporation.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE
```

## Google MediaPipe Tasks (Face Landmarker)

"Make a character from a photo or the camera" (grown-up area, behind the parental gate) uses Google's MediaPipe Face Landmarker, entirely on the device. The JavaScript library comes from the `@mediapipe/tasks-vision` package; its WebAssembly runtime and the `face_landmarker.task` model are copied into `public/face/` by `npm run face-model` (`scripts/face-model.ts`, with the exact versions in `public/face/VERSION.txt`) and served from our own site. Pictures are never saved or sent. MediaPipe's built-in usage logger is blocked twice: by the Content Security Policy and by answering requests to other sites locally. The grown-up area credits it.

Source: https://github.com/google-ai-edge/mediapipe

```
    Apache License 2.0

    Copyright Google LLC.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
```
