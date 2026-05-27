"""Tasks router — for the sticky-note / today's tasks widget."""
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models import Task
from app.modules.service_utils import clean_pagination

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("")
def list_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    skip, limit = clean_pagination(skip, limit)
    q = db.query(Task).order_by(Task.created_at.desc())
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return {"items": [_d(t) for t in items], "total": total, "skip": skip, "limit": limit}


@router.post("")
def create_task(payload: dict = Body(...), db: Session = Depends(get_db)):
    txt = payload.get("txt") or payload.get("text")
    if not txt:
        raise HTTPException(400, "txt is required")
    t = Task(txt=txt, done=bool(payload.get("done", False)))
    db.add(t)
    db.commit()
    db.refresh(t)
    return _d(t)


@router.put("/{task_id}")
def update_task(task_id: int, payload: dict = Body(...), db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    if "txt" in payload: t.txt = payload["txt"]
    if "done" in payload: t.done = bool(payload["done"])
    db.commit()
    db.refresh(t)
    return _d(t)


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(404, "Task not found")
    db.delete(t)
    db.commit()
    return {"deleted": task_id}


def _d(t):
    return {
        "id": t.id,
        "txt": t.txt,
        "done": bool(t.done),
        "created_at": t.created_at.isoformat() if t.created_at else None,
    }
