(() => {
  const questions = [
    '如果我明知孩子可能作出一个不够理想的选择，却没有及时提醒，即使最终后果可以控制，我也会觉得自己没有尽到家长责任。',
    '在孩子的重要教育选择上，即使外部专业人士有不同建议，我通常仍更信任自己基于长期了解作出的判断。',
    '在不涉及重大风险时，即使我不赞同孩子的选择，只要他能够说明理由，也应该拥有真实的决定空间。',
    '孩子的成绩和升学结果，在一定程度上反映了我作为家长在教育投入和规划上的成效。',
    '我认为，大多数孩子在学习习惯和做事节奏上的差异，都可以通过更合适的方法和持续训练明显缩小。',
    '在关键阶段，与其让孩子通过试错慢慢找到方向，不如由家长尽早指出并要求他沿着更合适的道路行动。',
    '即使不能带来更好的学历或就业起点，只要能够帮助孩子形成真实能力和独立判断，这段教育经历仍然值得投入。',
    '在后果基本可控时，让孩子承担自己选择带来的结果，并不意味着家长没有尽到责任。',
    '凭借自己的人生阅历，我通常能够比较准确地判断哪些教育和职业方向在未来更有发展前景。',
    '大多数青少年在重要教育选择上还缺乏足够经验，因此最终方向主要应由成年人把关。',
    '如果孩子拥有的学习和生活条件明显好于父母当年，我认为他理应取得更好的学习和发展结果。',
    '即使获得了合适的方法和充分支持，不同孩子在学习节奏和成熟速度上仍可能长期存在差异。',
    '在后果基本可控的情况下，一次不够理想的选择，也可能比直接接受家长给出的正确答案更有成长价值。',
    '一段教育经历是否值得，最终还是要看它能否转化为有认可度的学历或更好的职业机会。',
    '即使一件事已经明确交由孩子自己负责，只要我判断结果可能不理想，家长仍有责任在过程中进行提醒和纠正。',
    '即使孩子遇到的问题看起来与我过去的经历相似，当年对我有效的方法也未必适合今天的孩子。',
    '孩子的判断力需要通过参与真实选择并承担后果逐渐形成，而不是等到足够成熟以后才开始作决定。',
    '即使孩子最终没有达到我期待的成绩或学校，也不意味着我为其教育投入的时间和精力没有得到回报。',
    '当孩子在某方面进展较慢时，我更倾向于先检查方法和训练是否充分，而不是把它理解为个人特点或发展节奏不同。',
    '如果我确信某条道路明显更适合孩子，即使孩子暂时反对，坚持要求他按照这条道路行动也是一种负责任的做法。',
    '假设家庭能够为孩子提供长期稳定的经济保障，我认为经济独立不必成为他教育和职业发展的核心目标。'
  ];
  const scale = ['完全不同意', '比较不同意', '有一点不同意', '有一点同意', '比较同意', '完全同意'];
  const introPanel = document.querySelector('#introPanel');
  const profilePanel = document.querySelector('#profilePanel');
  const surveyPanel = document.querySelector('#surveyPanel');
  const questionnaireHeader = document.querySelector('.questionnaire-header');
  const completionPanel = document.querySelector('#completionPanel');
  const profileForm = document.querySelector('#profileForm');
  const profileError = document.querySelector('#profileError');
  const questionStage = document.querySelector('#questionStage');
  const answerError = document.querySelector('#answerError');
  const progressCount = document.querySelector('#progressCount');
  const progressBar = document.querySelector('#progressBar');
  const previousButton = document.querySelector('#previousButton');
  const nextButton = document.querySelector('#nextButton');
  let currentIndex = 0;
  const answers = Array(questions.length).fill(null);
  let profile = null;

  document.querySelector('#startSurveyButton').addEventListener('click', () => {
    introPanel.hidden = true;
    surveyPanel.hidden = false;
    questionnaireHeader.hidden = true;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const renderQuestion = () => {
    const selected = answers[currentIndex];
    progressCount.textContent = `第 ${currentIndex + 1} / ${questions.length} 题`;
    progressBar.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
    questionStage.innerHTML = `
      <p class="question-number">题目 ${currentIndex + 1}</p>
      <p class="question-text">${questions[currentIndex]}</p>
      <div class="answer-grid" role="radiogroup" aria-label="同意程度">
        ${scale.map((label, index) => `<div class="answer-option"><input id="answer-${index + 1}" type="radio" name="answer" value="${index + 1}" ${selected === index + 1 ? 'checked' : ''}><label for="answer-${index + 1}"><strong>${index + 1}</strong><span>${label}</span></label></div>`).join('')}
      </div>`;
    previousButton.disabled = currentIndex === 0;
    nextButton.textContent = currentIndex === questions.length - 1 ? '完成问卷 ✓' : '下一题 →';
    answerError.textContent = '';
  };

  profileForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!profileForm.reportValidity()) {
      profileError.textContent = '请完整填写基本信息后继续。';
      return;
    }
    profileError.textContent = '';
    profile = Object.fromEntries(new FormData(profileForm).entries());
    profilePanel.hidden = true;
    introPanel.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  nextButton.addEventListener('click', () => {
    const selected = questionStage.querySelector('input[name="answer"]:checked');
    if (!selected) {
      answerError.textContent = '请选择一个选项。';
      return;
    }
    answers[currentIndex] = Number(selected.value);
    if (currentIndex === questions.length - 1) {
      nextButton.disabled = true;
      nextButton.textContent = '正在保存...';
      answerError.textContent = '';
      fetch('/api/questionnaire-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, answers: Object.fromEntries(answers.map((value, index) => [String(index), value])) })
      }).then(async response => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || '问卷结果保存失败，请稍后重试。');
        surveyPanel.hidden = true;
        completionPanel.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }).catch(error => {
        answerError.textContent = error instanceof TypeError
          ? '暂时无法连接问卷保存服务，请检查网络后重试。'
          : error.message;
        nextButton.disabled = false;
        nextButton.textContent = '完成问卷 ✓';
      });
      return;
    }
    currentIndex += 1;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  previousButton.addEventListener('click', () => {
    if (currentIndex === 0) return;
    const selected = questionStage.querySelector('input[name="answer"]:checked');
    if (selected) answers[currentIndex] = Number(selected.value);
    currentIndex -= 1;
    renderQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
