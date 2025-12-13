# 우리집 홈페이지

간단한 정적 홈페이지 템플릿입니다. 모바일 우선, 반응형 디자인으로 구성되어 있습니다.

로컬 미리보기 방법:

1. 브라우저로 `index.html`을 직접 열기 (간단하지만 일부 브라우저가 로컬 파일을 제한할 수 있음)
2. Python 3로 로컬 서버 실행 (포트 8000):

```bash
python -m http.server 8000
# 그런 다음 브라우저에서 http://localhost:8000를 엽니다
```

3. npm 라이브 서버 설치 후 실행 (선택사항):

```bash
npm install -g live-server
live-server
```

배포 옵션:
- GitHub Pages: 저장소에 푸시 후 `gh-pages` 브랜치 또는 `main` 브랜치의 `docs/` 폴더를 사용하여 배포
- 정적 호스팅(예: Netlify, Vercel) — `index.html` 포함 프로젝트 루트를 업로드

커스터마이즈 아이디어:
- `styles/styles.css` 에 색상과 폰트를 변경
- `assets/` 폴더에 실제 사진을 넣기
- 외부 CDN(이미지/아이콘) 적용 또는 폼 백엔드 연결
