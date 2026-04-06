import mongoose from 'mongoose';
import Message from '../models/Message.js';
import ServiceRequest from '../models/ServiceRequest.js';

const idString = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref._id) return ref._id.toString();
  return ref.toString();
};

const participantIds = (request) => {
  const ids = [idString(request.customer)];
  const p = idString(request.provider);
  if (p) ids.push(p);
  return ids;
};

const isParticipant = (userId, request) => participantIds(request).includes(userId.toString());

const loadRequest = async (requestId) =>
  ServiceRequest.findById(requestId).populate('customer', 'name').populate('provider', 'name');

export const getMessages = async (req, res, next) => {
  try {
    const rawId = String(req.params.requestId || '').trim();
    if (!rawId || !mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ success: false, error: 'Invalid request id' });
    }

    const request = await loadRequest(rawId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    if (!isParticipant(req.user._id, request)) {
      return res.status(403).json({
        success: false,
        error:
          'Your account is not linked to this rescue request. Sign in with the same account you used for this emergency, or start a new request.',
      });
    }
    if (!['accepted', 'completed'].includes(request.status)) {
      return res.status(403).json({ success: false, error: 'Chat is not available for this request' });
    }

    const messages = await Message.find({ requestId: rawId })
      .sort({ createdAt: 1 })
      .lean();

    const payload = messages.map((m) => ({
      _id: m._id,
      requestId: m.requestId,
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      text: m.isDeleted ? null : m.text,
      isEdited: m.isEdited,
      isDeleted: m.isDeleted,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    res.json({
      success: true,
      messages: payload,
      request: {
        _id: request._id,
        status: request.status,
        serviceType: request.serviceType,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const sendMessageFromBody = async (req, res, next) => {
  try {
    const { requestId, senderId, text, timestamp: _timestamp } = req.body;
    void _timestamp;
    const rid = requestId != null ? String(requestId).trim() : '';
    if (!rid || !mongoose.Types.ObjectId.isValid(rid)) {
      return res.status(400).json({ success: false, error: 'Invalid or missing requestId' });
    }
    if (senderId != null && String(senderId) !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'senderId must match the logged-in user' });
    }
    req.params.requestId = rid;
    req.body = { text };
    return sendMessage(req, res, next);
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const requestId = String(req.params.requestId || '').trim();
    const { text: rawText } = req.body;
    const text = typeof rawText === 'string' ? rawText.trim() : '';
    if (!requestId || !mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ success: false, error: 'Invalid request id' });
    }
    if (!text) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    if (!isParticipant(req.user._id, request)) {
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }
    if (request.status !== 'accepted') {
      return res.status(403).json({ success: false, error: 'You can only send messages while the job is active' });
    }

    const custId = request.customer.toString();
    const provId = request.provider?.toString();
    const me = req.user._id.toString();

    let receiverId;
    if (me === custId) {
      if (!provId) {
        return res.status(400).json({ success: false, error: 'No provider assigned yet' });
      }
      receiverId = request.provider;
    } else if (me === provId) {
      receiverId = request.customer;
    } else {
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }

    const message = await Message.create({
      requestId,
      senderId: req.user._id,
      receiverId,
      text,
    });

    res.status(201).json({
      success: true,
      message: {
        _id: message._id,
        requestId: message.requestId,
        senderId: message.senderId.toString(),
        receiverId: message.receiverId.toString(),
        text: message.text,
        isEdited: message.isEdited,
        isDeleted: message.isDeleted,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { text: rawText } = req.body;
    const text = typeof rawText === 'string' ? rawText.trim() : '';
    if (!text) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const request = await ServiceRequest.findById(msg.requestId);
    if (!request || !isParticipant(req.user._id, request)) {
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }
    if (request.status !== 'accepted') {
      return res.status(403).json({ success: false, error: 'Cannot edit after job is completed' });
    }
    if (msg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only edit your own messages' });
    }
    if (msg.isDeleted) {
      return res.status(400).json({ success: false, error: 'Cannot edit a deleted message' });
    }

    msg.text = text;
    msg.isEdited = true;
    await msg.save();

    res.json({
      success: true,
      message: {
        _id: msg._id,
        senderId: msg.senderId.toString(),
        receiverId: msg.receiverId.toString(),
        text: msg.text,
        isEdited: msg.isEdited,
        isDeleted: msg.isDeleted,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const unsendMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const request = await ServiceRequest.findById(msg.requestId);
    if (!request || !isParticipant(req.user._id, request)) {
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }
    if (request.status !== 'accepted') {
      return res.status(403).json({ success: false, error: 'Cannot unsend after job is completed' });
    }
    if (msg.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only unsend your own messages' });
    }

    msg.isDeleted = true;
    await msg.save();

    res.json({
      success: true,
      message: {
        _id: msg._id,
        senderId: msg.senderId.toString(),
        receiverId: msg.receiverId.toString(),
        text: null,
        isEdited: msg.isEdited,
        isDeleted: msg.isDeleted,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'You can only load your own chat history' });
    }

    const uid = new mongoose.Types.ObjectId(userId);

    const grouped = await Message.aggregate([
      { $match: { $or: [{ senderId: uid }, { receiverId: uid }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$requestId',
          lastMessageAt: { $first: '$createdAt' },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    const requestIds = grouped.map((g) => g._id);
    if (requestIds.length === 0) {
      return res.json({ success: true, conversations: [] });
    }

    const requests = await ServiceRequest.find({ _id: { $in: requestIds } })
      .populate('customer', 'name')
      .populate('provider', 'name')
      .lean();

    const reqMap = new Map(requests.map((r) => [r._id.toString(), r]));

    const conversations = grouped
      .map((g) => {
        const r = reqMap.get(g._id.toString());
        if (!r) return null;

        const custId = r.customer?._id?.toString();
        const isCustomer = custId === userId;
        const other = isCustomer ? r.provider : r.customer;

        return {
          requestId: g._id,
          serviceType: r.serviceType,
          locationName: r.locationName,
          status: r.status,
          otherUserName: other?.name || 'Unknown',
          otherUserId: other?._id || null,
          lastMessageAt: g.lastMessageAt,
        };
      })
      .filter(Boolean);

    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
};
