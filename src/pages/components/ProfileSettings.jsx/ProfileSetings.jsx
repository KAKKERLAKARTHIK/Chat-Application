// src/pages/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch }        from 'react-redux';
import { useNavigate }                      from 'react-router-dom';
import { Formik }                           from 'formik';
import * as Yup                             from 'yup';
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Image
} from 'react-bootstrap';
import { setCredentials }                   from '../slice/Auth';

export default function ProfileSettings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user     = useSelector(s => s.auth.user);

  // 1️⃣ Keep URL and File separate
  const [previewUrl, setPreviewUrl] = useState(
    user.avatarUrl
      ? // if it's relative, prefix origin
        new URL(user.avatarUrl, window.location.origin).href
      : '/default-avatar.png'
  );
  const [file, setFile] = useState(null);

  // Formik setup
  const initialValues = {
    name:  user.name || '',
    about: user.about || ''
  };

  const validationSchema = Yup.object({
    name:  Yup.string().required('Your name is required'),
    about: Yup.string().max(100, 'Max 100 characters')
  });

  const handleSubmit = (values, { setSubmitting }) => {
    // 2️⃣ If you need to upload the file, do it here and get back a URL...
    //    For this mock, we'll just keep previewUrl as the avatarUrl.
    const updated = {
      ...user,
      name:      values.name,
      about:     values.about,
      avatarUrl: previewUrl   // in real life, this would be the URL returned from your upload API
    };

    dispatch(setCredentials(updated));
    setSubmitting(false);
    navigate('/');
  };

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={6}>
          <h2>Profile</h2>
          <Card className="p-4">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleBlur,
                handleSubmit,
                isSubmitting
              }) => (
                <Form noValidate onSubmit={handleSubmit}>
                  {/* Avatar */}
                  <Form.Group className="text-center mb-4">
                    <div
                      style={{
                        width: 120,
                        height: 120,
                        margin: '0 auto',
                        position: 'relative',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#eee'
                      }}
                    >
                      {/* 3️⃣ Simply render previewUrl */}
                      <Image
                        src={previewUrl}
                        roundedCircle
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* 4️⃣ Invisible file input on top */}
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const selected = e.currentTarget.files[0];
                          if (selected) {
                            setFile(selected);
                            // generate a blob URL for preview
                            const blobUrl = URL.createObjectURL(selected);
                            setPreviewUrl(blobUrl);
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <Form.Text className="text-muted">
                      Click to change photo
                    </Form.Text>
                  </Form.Group>

                  {/* Name */}
                  <Form.Group className="mb-3">
                    <Form.Label>Your name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.name && !!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>

                  {/* About */}
                  <Form.Group className="mb-4">
                    <Form.Label>About</Form.Label>
                    <Form.Control
                      type="text"
                      name="about"
                      value={values.about}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.about && !!errors.about}
                      placeholder="Say something about yourself"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.about}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-flex justify-content-between">
                    <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                      Save
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
