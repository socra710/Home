document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  toggle.addEventListener('click', function(){
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    if(!expanded){
      nav.style.display = 'block'
    } else {
      nav.style.display = ''
    }
  })

  const form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const name = form.elements['name'].value || '익명';
      alert(name + '님, 메시지가 전송되었습니다 (샘플 폼).');
      form.reset();
    })
  }
})
